/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { watchers, baseWatchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, ValueOf, RecordType, TerminateRecord } from '@timecat/share'
import { getDBOperator, logError, IndexedDBOperator, nodeStore, getTime, stateDebounce } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'
import { LocationWatcher } from './watchers/location'
import { Pluginable, RecorderPlugin } from './pluginable'
import { Watcher } from './watcher'

export { Watcher, WatcherOptions } from './watcher'
export { RecordData } from '@timecat/share'

export type RewriteResource = (RewriteItem<'rewrite'> | RewriteItem<'preFetch'>)[]
export interface RecordOptions extends RecordOptionsBase {
    plugins?: RecorderPlugin[]
    rewriteResource?: RewriteResource
}

interface RecordOptionsBase {
    context?: Window
    audio?: boolean
    write?: boolean
    keep?: boolean
    emitLocationImmediate?: boolean
    font?: boolean
    visibleChange?: boolean
}

interface RecordInternalOptions extends RecordOptions {
    context: Window
}

export type RewriteItem<Type extends 'rewrite' | 'preFetch'> = {
    matches: (string | RegExp)[]
    type?: Type
    rewrite: Type extends 'preFetch' ? PreFetchRewriteConfig : RewriteConfig
}

interface RewriteConfig {
    replaceOrigin?: string
    folderPath?: string
    fn?: (pre: string, next: string) => string | void
}

interface PreFetchRewriteConfig extends RewriteConfig {
    matches?: (string | RegExp)[]
    crossUrl?: string
}

export class Recorder {
    onData: (cb: (data: RecordData) => void) => void
    destroy: () => void
    use: (plugin: RecorderPlugin) => void
    clearDB: () => Promise<void>
    constructor(options?: RecordOptions) {
        const recorder = new RecorderModule(options)
        const { onData, destroy, use, clearDB } = recorder
        this.onData = onData.bind(recorder)
        this.destroy = destroy.bind(recorder)
        this.use = use.bind(recorder)
        this.clearDB = clearDB.bind(recorder)
    }
}

export class RecorderModule extends Pluginable {
    private static defaultRecordOpts = {
        mode: 'default',
        write: true,
        keep: false,
        emitLocationImmediate: true,
        context: window,
        visibleChange: false
    } as RecordOptions
    private destroyStore: Set<Function> = new Set()
    private listenStore: Set<Function> = new Set()
    private onDataCallback: Function
    private watchers: Array<typeof Watcher>
    private watchersInstance = new Map<string, Watcher<RecordData>>()
    private watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve))
    private watcherResolve: Function

    public db: IndexedDBOperator
    public options: RecordInternalOptions

    constructor(options?: RecordOptions) {
        super(options)
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        this.options = opts
        this.watchers = this.getWatchers() as typeof Watcher[]
        this.init()
    }

    private async init() {
        const options = this.options
        const db = await getDBOperator
        this.db = db
        this.pluginsOnload()
        this.hooks.beforeRun.call(this)
        this.record(options)
        this.hooks.run.call(this)
        if (options.visibleChange) {
            this.listenVisibleChange(options)
        }
    }

    public onData(cb: (data: RecordData) => void) {
        this.onDataCallback = cb
    }

    public async destroy() {
        await this.cancelListener()
        this.destroyStore.forEach(un => un())
        this.destroyStore.clear()
    }

    public async clearDB() {
        await this.db.clear()
    }

    private async cancelListener() {
        // wait for watchers loaded
        await this.watchesReadyPromise
        this.listenStore.forEach(un => un())
        this.listenStore.clear()
        nodeStore.reset()
    }

    private getWatchers() {
        const options = this.options
        const watchersList = [Snapshot, ...Object.values(watchers)] as typeof Watcher[]
        if (options && options.audio) {
            watchersList.push(RecordAudio as typeof Watcher)
        }
        return watchersList
    }

    private record(options: RecordOptions | RecordInternalOptions): void {
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        this.startRecord((opts.context.G_RECORD_OPTIONS = opts))
    }

    private async startRecord(options: RecordInternalOptions) {
        let activeWatchers = [...this.watchers, ...this.pluginWatchers]

        // is record iframe, switch context
        if (options.context === window) {
            if (!options.keep) {
                this.db.clear()
            }
        } else {
            // for iframe watchers
            activeWatchers = [Snapshot, ...Object.values(baseWatchers)] as typeof Watcher[]
        }

        const onEmit = (options: RecordOptions) => {
            const { write } = options
            return (data: RecordData) => {
                if (!data) {
                    return
                }

                this.hooks.emit.call(data)

                this.onDataCallback && this.onDataCallback(data)

                if (write) {
                    this.db.addRecord(data)
                }
            }
        }

        const emit = onEmit(options)

        const headData = await getHeadData()

        const relatedId = headData.relatedId

        options.context.G_RECORD_RELATED_ID = relatedId

        if (options.context === window) {
            emit({
                type: RecordType.HEAD,
                data: headData,
                relatedId,
                time: getTime()
            })
        }

        activeWatchers.forEach(Watcher => {
            const watcher = new Watcher({
                recorder: this,
                context: options && options.context,
                listenStore: this.listenStore,
                relatedId,
                emit,
                watchers: this.watchersInstance
            })
            this.watchersInstance.set(Watcher.name, watcher)
        })

        if (options.emitLocationImmediate) {
            const locationInstance = this.watchersInstance.get('LocationWatcher') as InstanceType<
                typeof LocationWatcher
            >
            locationInstance?.emitOne()
        }

        this.watcherResolve()
        await this.recordSubIFrames(options.context)
    }

    private async waitingSubIFramesLoaded(context: Window) {
        const frames = context.frames
        const validFrames = Array.from(frames)
            .filter(frame => {
                try {
                    return frame.frameElement.getAttribute('src')
                } catch (e) {
                    logError(e)
                    return false
                }
            })
            .map(frame => {
                return new Promise(resolve => {
                    if (frame.document.readyState === 'complete') {
                        resolve(frame)
                    } else {
                        frame.addEventListener('load', () => {
                            resolve(frame)
                        })
                    }
                })
            })
        if (!validFrames.length) {
            return Promise.resolve([])
        }
        return Promise.all(validFrames) as Promise<Window[]>
    }

    private async waitingIFrameLoaded(frame: Window): Promise<Window | undefined> {
        try {
            frame.document && frame.frameElement.getAttribute('src')!
        } catch (e) {
            logError(e)
            return
        }

        return new Promise(resolve => {
            const timer = window.setInterval(() => {
                if (frame.document) {
                    clearInterval(timer)
                    resolve(frame)
                }
            }, 200)
        })
    }

    public async recordSubIFrames(context: Window) {
        const frames = await this.waitingSubIFramesLoaded(context)
        frames.forEach(frameWindow => {
            this.createIFrameRecorder(frameWindow)
        })
    }

    public async recordIFrame(context: Window) {
        const frameWindow = await this.waitingIFrameLoaded(context)
        if (frameWindow) {
            this.createIFrameRecorder(frameWindow)
        }
    }

    private createIFrameRecorder(frameWindow: Window) {
        const frameRecorder = new RecorderModule({ context: frameWindow, keep: true })
        const frameElement = frameWindow.frameElement as Element & { frameRecorder: RecorderModule }
        frameElement.frameRecorder = frameRecorder
        this.destroyStore.add(() => frameRecorder.destroy())
    }

    private listenVisibleChange(this: RecorderModule, options: RecordInternalOptions) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            const viewChangeHandle = (state: 'show' | 'hide') => {
                if (state === 'hide') {
                    const data = {
                        type: RecordType.TERMINATE,
                        data: null,
                        relatedId: window.G_RECORD_RELATED_ID,
                        time: getTime()
                    }
                    if (data.relatedId) {
                        this.db.addRecord(data as TerminateRecord)
                        this.onDataCallback && this.onDataCallback(data)
                    }
                    this.hooks.end.call()
                    this.destroy()
                } else {
                    this.record({ ...options, keep: true, emitLocationImmediate: false })
                }
            }

            stateDebounce<'show' | 'hide'>(
                useState => {
                    const handle = () => {
                        if (document[hidden]) {
                            useState('hide')
                            return
                        }
                        useState('show')
                    }

                    document.addEventListener(visibilityChange, handle, false)
                },
                state => (state === 'hide' ? 5000 : 0),
                'show'
            )(viewChangeHandle)
        }
    }
}
