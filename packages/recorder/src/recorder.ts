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
import { RecordData, RecordType, TerminateRecord } from '@timecat/share'
import {
    logError,
    nodeStore,
    getTime,
    stateDebounce,
    throttle,
    tempEmptyFn,
    tempEmptyPromise,
    IDB,
    idb,
    delay
} from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'
import { LocationWatcher } from './watchers/location'
import { Pluginable, RecorderPlugin } from './pluginable'
import { Watcher } from './watcher'

export { Watcher, WatcherOptions } from './watcher'
export { RecordData } from '@timecat/share'

export type RecorderMiddleware = (data: RecordData, n: () => Promise<void>) => Promise<void>

interface RecordOptionsBase {
    context?: Window
    rootContext?: Window
    audio?: boolean
    write?: boolean
    keep?: boolean
    emitLocationImmediate?: boolean
    font?: boolean
    visibleChange?: boolean
    visibleChangeKeepTime?: number
    disableWatchers?: Array<keyof typeof watchers | 'Snapshot'>
    keepAlive?: number | false
}

interface RecordInternalOptions extends Required<RecordOptions> {
    context: Window
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

enum Status {
    RUNNING = 'running',
    PAUSE = 'pause',
    HALT = 'halt'
}

export type RewriteResource = RewriteItem[]
export interface RecordOptions extends RecordOptionsBase {
    plugins?: RecorderPlugin[]
    rewriteResource?: RewriteResource
}

export interface RewriteItem {
    matches: (string | RegExp)[]
    type?: string
    rewrite: PreFetchRewriteConfig & RewriteConfig
}

export class Recorder {
    public status: Status = Status.PAUSE
    public onData: RecorderModule['onData'] = tempEmptyFn
    public destroy: RecorderModule['destroy'] = tempEmptyPromise
    public use: RecorderModule['use'] = tempEmptyFn
    public clearDB: RecorderModule['clearDB'] = tempEmptyPromise
    constructor(options?: RecordOptions) {
        const recorder = new RecorderModule(options)
        Object.keys(this).forEach((key: keyof Recorder) => {
            Object.defineProperty(this, key, {
                get() {
                    return typeof recorder[key] === 'function'
                        ? (recorder[key] as Function).bind(recorder)
                        : recorder[key]
                }
            })
        })
    }
}

export class RecorderModule extends Pluginable {
    private static defaultRecordOpts = {
        mode: 'default',
        write: true,
        keep: false,
        emitLocationImmediate: true,
        context: window,
        visibleChange: false,
        visibleChangeKeepTime: 5000,
        rewriteResource: [],
        disableWatchers: [],
        keepAlive: false
    } as RecordOptions
    private defaultMiddlewares: RecorderMiddleware[] = []
    private destroyStore: Set<Function> = new Set()
    private listenStore: Set<Function> = new Set()
    private middlewares: RecorderMiddleware[] = [...this.defaultMiddlewares]
    private watchers: Array<typeof Watcher>
    private watchersInstance = new Map<string, Watcher<RecordData>>()
    private watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve))
    private watcherResolve: Function
    private destroyTime: number
    private destroyWaitTime = 200

    public status: Status = Status.PAUSE
    public db: IDB
    public options: RecordInternalOptions

    constructor(options?: RecordOptions) {
        super(options)
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        opts.rootContext = opts.rootContext || opts.context
        this.options = opts
        this.watchers = this.getWatchers() as typeof Watcher[]
        this.init()
    }

    private init() {
        const options = this.options
        this.db = idb
        this.loadPlugins()
        this.hooks.beforeRun.call(this)
        this.record(options)
        this.hooks.run.call(this)

        let refresh: (() => void) | undefined = undefined
        let clear: (() => void) | undefined = undefined
        if (options.keepAlive) {
            const { refresh: r, clear: c } = this.enableKeepAlive(options.keepAlive)
            ;(refresh = r), (clear = c)
        }
        if (options.visibleChange) {
            this.listenVisibleChange(options, { keepAlive: { refresh, clear } })
        }
    }

    public onData(fn: (data: RecordData, next: () => Promise<void>) => Promise<void>) {
        this.middlewares.unshift(fn)
    }

    public async destroy() {
        if (this.status === Status.HALT) {
            return
        }

        const ret = await this.pause()
        if (ret) {
            this.status = Status.HALT
            this.destroyTime = ret.lastTime || getTime()
        }
    }

    private async pause() {
        if (this.status === Status.RUNNING) {
            this.status = Status.PAUSE
            const last = await this.db.last().catch(() => {})
            let lastTime: number | null = null
            if (last) {
                lastTime = last.time + 1
                const data = {
                    type: RecordType.TERMINATE,
                    data: null,
                    relatedId: window.G_RECORD_RELATED_ID,
                    time: lastTime
                }

                if (data.relatedId) {
                    if (this.options.write) {
                        this.db.add(data as TerminateRecord)
                    }
                    this.connectCompose(this.middlewares)(data as RecordData)
                }
            }

            await this.cancelListener()
            this.destroyStore.forEach(un => un())
            this.destroyStore.clear()
            return { lastTime }
        }
    }

    public clearDB() {
        this.db.clear()
    }

    private async cancelListener() {
        // wait for watchers loaded
        await this.watchesReadyPromise
        this.listenStore.forEach(un => un())
        this.listenStore.clear()
        nodeStore.reset()
    }

    private getWatchers() {
        const { audio, disableWatchers } = this.options
        const watchersList = [Snapshot, ...Object.values(watchers)] as typeof Watcher[]
        if (audio) {
            watchersList.push(RecordAudio as typeof Watcher)
        }

        return watchersList.filter(watcher => {
            return !~disableWatchers.indexOf(watcher.name as keyof typeof watchers | 'Snapshot')
        })
    }

    private record(options: RecordOptions | RecordInternalOptions): void {
        if (this.status === Status.PAUSE) {
            const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
            this.startRecord((opts.context.G_RECORD_OPTIONS = opts))
            return
        }
    }

    private async startRecord(options: RecordInternalOptions) {
        let activeWatchers = [...this.watchers, ...this.pluginWatchers]

        if (options.context === this.options.rootContext) {
            if (!options.keep) {
                this.db.clear()
            }
            this.status = Status.RUNNING
        } else {
            // for iframe watchers
            activeWatchers = [Snapshot, ...Object.values(baseWatchers)] as typeof Watcher[]
        }

        const onEmit = (options: RecordOptions) => {
            const { write } = options
            const emitTasks: Array<RecordData> = []

            const execTasksChain = (() => {
                let concurrency = 0
                const MAX_CONCURRENCY = 1
                return async () => {
                    if (concurrency >= MAX_CONCURRENCY) {
                        return
                    }
                    concurrency++
                    while (emitTasks.length) {
                        const record = emitTasks.shift()!
                        await delay(0)
                        await this.connectCompose(this.middlewares)(record)
                        if (!this.destroyTime || getTime() < this.destroyTime + this.destroyWaitTime) {
                            this.hooks.emit.call(record)
                            if (write) {
                                this.db.add(record)
                            }
                        }
                    }
                    concurrency--
                }
            })()

            return (data: RecordData) => {
                if (!data) {
                    return
                }

                emitTasks.push(data)
                execTasksChain()
            }
        }

        const emit = onEmit(options)

        const headData = getHeadData()

        const relatedId = headData.relatedId

        options.context.G_RECORD_RELATED_ID = relatedId

        if (options.context === this.options.rootContext) {
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
            const locationInstance = this.watchersInstance.get(LocationWatcher.name) as InstanceType<
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
                    return frame.frameElement && frame.frameElement.getAttribute('src')
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
            frame.document && frame.frameElement && frame.frameElement.getAttribute('src')!
        } catch (e) {
            logError(e)
            return
        }

        return new Promise(resolve => {
            const timer = window.setInterval(() => {
                try {
                    if (frame.document) {
                        clearInterval(timer)
                        resolve(frame)
                    }
                } catch (e) {
                    logError(e)
                    clearInterval(timer)
                    resolve(undefined)
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
        const frameRecorder = new RecorderModule({
            context: frameWindow,
            keep: true,
            rootContext: this.options.rootContext
        })
        const frameElement = frameWindow.frameElement as Element & { frameRecorder: RecorderModule }
        frameElement.frameRecorder = frameRecorder
        this.destroyStore.add(() => frameRecorder.destroy())
    }

    private listenVisibleChange(
        this: RecorderModule,
        options: RecordInternalOptions,
        ref?: { keepAlive?: { refresh?: () => void; clear?: () => void } }
    ) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            enum ViewChangeState {
                'show' = 'show',
                'hide' = 'hide'
            }

            const { clear, refresh } = ref?.keepAlive || {}

            const viewChangeHandle = (state: keyof typeof ViewChangeState) => {
                if (state === ViewChangeState.hide) {
                    this.hooks.end.call()
                    this.pause()
                    clear && clear()
                } else {
                    this.record({ ...options, keep: true, emitLocationImmediate: false })
                    refresh && refresh()
                }
            }

            stateDebounce<keyof typeof ViewChangeState>(
                useState => {
                    const handle = () => {
                        if (document[hidden]) {
                            useState(ViewChangeState.hide)
                            return
                        }
                        useState(ViewChangeState.show)
                    }

                    document.addEventListener(visibilityChange, handle, false)
                },
                state =>
                    state !== ViewChangeState.hide || this.status !== Status.RUNNING
                        ? 0
                        : options.visibleChangeKeepTime,
                ViewChangeState.show
            )(viewChangeHandle)
        }
    }

    private connectCompose(list: RecorderMiddleware[]) {
        return async (data: RecordData) => {
            return await list.reduce(
                (next: () => Promise<void>, fn: RecorderMiddleware) => {
                    return this.createNext(fn, data, next)
                },
                () => Promise.resolve()
            )()
        }
    }

    private createNext(fn: RecorderMiddleware, data: RecordData, next: () => Promise<void>) {
        return async () => await fn(data, next)
    }

    private enableKeepAlive(this: RecorderModule, waitTime: number) {
        const eventNames = ['click', 'mousemove', 'scroll']
        let timer = 0
        return (() => {
            const clear = () => {
                clearTimeout(timer)
                timer = 0
            }
            const refresh = () => {
                clear()
                if (this.status !== Status.RUNNING) {
                    return
                }
                timer = window.setTimeout(() => this.pause(), waitTime)
            }
            const handle = () => {
                if (this.status !== Status.RUNNING) {
                    this.record({ ...this.options, keep: true, emitLocationImmediate: false })
                }
                refresh()
            }

            eventNames.forEach(name => document.addEventListener(name, throttle(handle, 500)))
            handle()

            return {
                refresh,
                clear
            }
        })()
    }
}
