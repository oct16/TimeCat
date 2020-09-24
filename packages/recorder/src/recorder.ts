import { watchers as RecorderWatchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, ValueOf, RecordType, TerminateRecord } from '@timecat/share'
import { getDBOperator, logError, getRadix64TimeStr, IndexedDBOperator, nodeStore } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'
import { Pluginable, RecorderPlugin } from './pluginable'

export interface RecordInternalOptions extends RecordOptions {
    context: Window
    skip?: boolean
}

export interface RecordOptions {
    mode?: 'live' | 'default'
    audio?: boolean
    write?: boolean
    plugins?: RecorderPlugin[]
}

export class Recorder extends Pluginable {
    private static defaultRecordOpts = { mode: 'default', write: true, context: window } as RecordOptions
    private destroyStore: Set<Function> = new Set()
    private listenStore: Set<Function> = new Set()
    private onDataCallback: Function
    private watchers: Array<ValueOf<typeof RecorderWatchers> | typeof RecordAudio | typeof Snapshot>
    private watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve))
    private watcherResolve: Function

    public db: IndexedDBOperator

    constructor(options?: RecordOptions) {
        super(options)
        const opts = { ...Recorder.defaultRecordOpts, ...options } as RecordInternalOptions
        this.watchers = this.getWatchers(opts)
        this.init(opts)
    }

    private async init(options: RecordInternalOptions) {
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
        await this.cancelListen()
        this.destroyStore.forEach(un => un())
    }

    private async cancelListen() {
        // wait for watchers loaded
        await this.watchesReadyPromise
        this.listenStore.forEach(un => un())
        nodeStore.reset()
    }

    private getWatchers(options: RecordOptions) {
        const watchers: Array<ValueOf<typeof RecorderWatchers> | typeof RecordAudio | typeof Snapshot> = [
            Snapshot,
            ...Object.values(RecorderWatchers)
        ]
        if (options && options.audio) {
            watchers.push(RecordAudio)
        }
        return watchers
    }

    public record(options: RecordOptions): void
    public record(options: RecordInternalOptions): void

    public record(options: RecordOptions): void {
        const opts = { ...Recorder.defaultRecordOpts, ...options } as RecordInternalOptions
        this.startRecord((opts.context.G_RECORD_OPTIONS = opts))
    }

    private async startRecord(options: RecordInternalOptions) {
        let activeWatchers = this.watchers

        // is record iframe, switch context
        if (options.context === window) {
            if (!options.skip) {
                this.db.clear()
            }
        } else {
            // for iframe watchers
            activeWatchers = [
                Snapshot,
                RecorderWatchers.MouseWatcher,
                RecorderWatchers.DOMWatcher,
                RecorderWatchers.FormElementWatcher,
                RecorderWatchers.ScrollWatcher
            ]
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
        if (options.context) {
            options.context.G_RECORD_RELATED_ID = relatedId
        }
        emit({
            type: RecordType.HEAD,
            data: headData,
            relatedId: relatedId,
            time: getRadix64TimeStr()
        })

        activeWatchers.forEach(watcher => {
            new watcher({
                context: options && options.context,
                listenStore: this.listenStore,
                relatedId: relatedId,
                emit
            })
        })

        this.watcherResolve()
        await this.recordFrames(options.context)
    }

    private async waitingFramesLoaded(context: Window) {
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
                    const { head, body } = frame.document
                    if (head.children.length || body.children.length) {
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

    private async recordFrames(context: Window) {
        const frames = await this.waitingFramesLoaded(context)
        frames.forEach(frameWindow => this.record({ context: frameWindow }))
    }

    private listenVisibleChange(this: Recorder, options: RecordInternalOptions) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            async function handleVisibilityChange(this: Recorder) {
                if (document[hidden]) {
                    const data = {
                        type: RecordType.TERMINATE,
                        data: null,
                        relatedId: options.context.G_RECORD_RELATED_ID,
                        time: getRadix64TimeStr()
                    }
                    this.db.addRecord(data as TerminateRecord)
                    this.onDataCallback && this.onDataCallback(data)
                    this.cancelListen()
                    this.hooks.end.call()
                } else {
                    this.record({ ...options, skip: true } as RecordInternalOptions)
                }
            }

            const handle = handleVisibilityChange.bind(this)

            document.addEventListener(visibilityChange, handle, false)

            this.destroyStore.add(() => document.removeEventListener(visibilityChange, handle, false))
        }
    }
}
