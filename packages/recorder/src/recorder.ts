import { watchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, RecordOptions, ValueOf } from '@timecat/share'
import { getDBOperator, logError } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'

export class Recorder {
    private static defaultRecordOpts = { mode: 'default' } as RecordOptions
    private reverseStore: Set<Function> = new Set()

    constructor(options: RecordOptions) {
        this.record(options)
        this.listenVisibleChange(options)
    }

    public unsubscribe() {
        this.reverseStore.forEach(un => un())
    }

    private getRecorders(options: RecordOptions) {
        const context = options.context || window
        context.__RecordOptions__ = options

        const recorders: Array<ValueOf<typeof watchers> | typeof RecordAudio | typeof Snapshot> = [
            Snapshot,
            ...Object.values(watchers)
        ]
        if (options && options.audio) {
            recorders.push(RecordAudio)
        }
        return recorders
    }

    public record(options: RecordOptions) {
        const opts = { ...Recorder.defaultRecordOpts, ...options }
        this.startRecord(opts)
    }

    private async startRecord(options: RecordOptions) {
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

        function onEmit(options: RecordOptions) {
            const { onData } = options
            return (data: RecordData) => {
                if (!data) {
                    return
                }
                let ret
                if (onData) {
                    ret = onData(data, db)
                    if (!ret) {
                        return
                    }
                }
                db.addRecord(ret || data)
            }
        }

        const emit = onEmit(options)

        emit(getHeadData())
        iframeWatchers.forEach(watcher => {
            new watcher({
                context: (options && options.context) || window,
                reverseStore: this.reverseStore,
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

    listenVisibleChange(this: Recorder, options: RecordOptions) {
        if (typeof document.hidden !== 'undefined') {
            const hidden = 'hidden'
            const visibilityChange = 'visibilitychange'

            function handleVisibilityChange(this: Recorder) {
                if (document[hidden]) {
                    this.unsubscribe()
                } else {
                    this.record({ ...options, skip: true })
                }
            }

            document.addEventListener(visibilityChange, handleVisibilityChange.bind(this), false)

            this.reverseStore.add(() =>
                document.removeEventListener(visibilityChange, handleVisibilityChange.bind(this), false)
            )
        }
    }
}
