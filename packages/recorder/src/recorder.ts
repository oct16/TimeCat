import { watchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, RecordOptions, ValueOf, RecordType, RecordInternalOptions } from '@timecat/share'
import { getDBOperator, logError, Transmitter, getRadix64TimeStr } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'

export class Recorder {
    private static defaultRecordOpts = { mode: 'default', write: true } as RecordOptions
    private reverseStore: Set<Function> = new Set()
    private onDataCallback: Function

    constructor(options?: RecordOptions) {
        const opts = { ...Recorder.defaultRecordOpts, ...options }

        // TODO: Plugin module
        if (opts && opts.uploadUrl) {
            new Transmitter(opts.uploadUrl)
        }

        this.record(opts)
        this.listenVisibleChange(opts)
    }

    public onData(cb: (data: RecordData) => void) {
        this.onDataCallback = cb
    }

    public unsubscribe() {
        this.reverseStore.forEach(un => un())
    }

    private getRecorders(options: RecordOptions) {
        const recorders: Array<ValueOf<typeof watchers> | typeof RecordAudio | typeof Snapshot> = [
            Snapshot,
            ...Object.values(watchers)
        ]
        if (options && options.audio) {
            recorders.push(RecordAudio)
        }
        return recorders
    }

    public record(options: RecordOptions): void
    public record(options: RecordInternalOptions): void

    public record(options: RecordOptions): void {
        this.startRecord(options as RecordInternalOptions)
    }

    private async startRecord(options: RecordInternalOptions) {
        options.context.G_RECORD_OPTIONS = options
        const db = await getDBOperator

        const allRecorders = this.getRecorders(options)
        let iframeWatchers = allRecorders

        // is record iframe, switch context
        if (!options || !options.context) {
            if (!options.skip) {
                db.clear()
            }
        } else {
            iframeWatchers = [
                Snapshot,
                watchers.MouseWatcher,
                watchers.DOMWatcher,
                watchers.FormElementWatcher,
                watchers.ScrollWatcher
            ]
        }

        const onEmit = (options: RecordOptions) => {
            const { write } = options
            return (data: RecordData) => {
                if (!data) {
                    return
                }

                this.onDataCallback && this.onDataCallback(data)

                if (write) {
                    db.addRecord(data)
                }
            }
        }

        const emit = onEmit(options)

        const headData = getHeadData()
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

        iframeWatchers.forEach(watcher => {
            new watcher({
                context: (options && options.context) || window,
                reverseStore: this.reverseStore,
                relatedId: relatedId,
                emit
            })
        })

        await this.recordFrames()
    }

    private async waitingFramesLoaded() {
        const frames = window.frames
        const tasks = Array.from(frames)
            .filter(frame => {
                try {
                    const frameElement = frame.frameElement
                    return frameElement.getAttribute('src')
                } catch (e) {
                    logError(e)
                    return false
                }
            })
            .map(frame => {
                const frameDocument = frame
                return new Promise(resolve => {
                    frameDocument.addEventListener('load', () => {
                        resolve(frame)
                    })
                })
            })
        if (!tasks.length) {
            return Promise.resolve([])
        }
        return Promise.all(tasks) as Promise<Window[]>
    }

    private async recordFrames() {
        const frames = await this.waitingFramesLoaded()
        frames.forEach(frameWindow => this.record({ context: frameWindow }))
    }

    private listenVisibleChange(this: Recorder, options: RecordOptions) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            function handleVisibilityChange(this: Recorder) {
                if (document[hidden]) {
                    this.unsubscribe()
                } else {
                    this.record({ ...options, skip: true } as RecordInternalOptions)
                }
            }

            document.addEventListener(visibilityChange, handleVisibilityChange.bind(this), false)

            this.reverseStore.add(() =>
                document.removeEventListener(visibilityChange, handleVisibilityChange.bind(this), false)
            )
        }
    }
}
