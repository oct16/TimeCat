import { watchers, baseWatchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, ValueOf, RecordType, TerminateRecord, RecordOptionsBase } from '@timecat/share'
import { getDBOperator, logError, IndexedDBOperator, nodeStore, getTime } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'
import { LocationWatcher } from './watchers/location'
import { Pluginable, RecorderPlugin } from './pluginable'

export interface RecordInternalOptions extends RecordOptions {
    context: Window
}

export interface RecordOptions extends RecordOptionsBase {
    plugins?: RecorderPlugin[]
    rewriteResource?: RewriteResource
}

export interface RewriteResource {
    matches: string[]
    replaceOrigin: string
    folderPath?: string
    fn?: (oldUrl: string, nextUrl: string) => void
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
        context: window
    } as RecordOptions
    private destroyStore: Set<Function> = new Set()
    private listenStore: Set<Function> = new Set()
    private onDataCallback: Function
    private watchers: Array<ValueOf<typeof watchers> | typeof RecordAudio | typeof Snapshot>
    private watchersInstance = new Map<string, InstanceType<ValueOf<typeof watchers>> | RecordAudio | Snapshot>()
    private watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve))
    private watcherResolve: Function

    public db: IndexedDBOperator
    public options: RecordInternalOptions

    constructor(options?: RecordOptions) {
        super(options)
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        this.options = opts
        this.watchers = this.getWatchers()
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
        this.listenVisibleChange(options)
    }

    public onData(cb: (data: RecordData) => void) {
        this.onDataCallback = cb
    }

    public async destroy() {
        await this.cancelListener()
        this.destroyStore.forEach(un => un())
    }

    public async clearDB() {
        await this.db.clear()
    }

    private async cancelListener() {
        // wait for watchers loaded
        await this.watchesReadyPromise
        this.listenStore.forEach(un => un())
        nodeStore.reset()
    }

    private getWatchers() {
        const options = this.options
        const watchersList: Array<ValueOf<typeof watchers> | typeof RecordAudio | typeof Snapshot> = [
            Snapshot,
            ...Object.values(watchers)
        ]
        if (options && options.audio) {
            watchersList.push(RecordAudio)
        }
        return watchersList
    }

    private record(options: RecordOptions): void
    private record(options: RecordInternalOptions): void

    private record(options: RecordOptions): void {
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        this.startRecord((opts.context.G_RECORD_OPTIONS = opts))
    }

    private async startRecord(options: RecordInternalOptions) {
        let activeWatchers = this.watchers

        // is record iframe, switch context
        if (options.context === window) {
            if (!options.keep) {
                this.db.clear()
            }
        } else {
            // for iframe watchers
            activeWatchers = [Snapshot, ...Object.values(baseWatchers)]
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
            locationInstance.emitOne()
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
            frame.frameElement.getAttribute('src')!
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
        const frameElement = frameWindow.frameElement as any
        frameElement.frameRecorder = frameRecorder
    }

    private listenVisibleChange(this: RecorderModule, options: RecordInternalOptions) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            async function handleVisibilityChange(this: RecorderModule) {
                if (document[hidden]) {
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
                    this.cancelListener()
                    this.hooks.end.call()
                } else {
                    this.record({ ...options, keep: true, emitLocationImmediate: false })
                }
            }

            const handle = handleVisibilityChange.bind(this)

            document.addEventListener(visibilityChange, handle, false)

            this.destroyStore.add(() => document.removeEventListener(visibilityChange, handle, false))
        }
    }
}
