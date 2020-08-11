import { watchers } from './watchers'
import { RecordAudio } from './audio'
import { RecordData, RecordOptions, ValueOf } from '@timecat/share'
import { uninstallStore, getDBOperator, logError } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'

const defaultRecordOpts = { mode: 'default' } as RecordOptions

function getRecorders(options: RecordOptions) {
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

export const record = (options: RecordOptions) => {
    const opts = { ...defaultRecordOpts, ...options }
    startRecord(opts)
    return {
        unsubscribe: () => {
            Array.from(uninstallStore.values()).forEach(un => un())
        }
    }
}

async function startRecord(options: RecordOptions) {
    const db = await getDBOperator

    const allRecorders = getRecorders(options)
    let iframeWatchers = allRecorders

    // is record iframe, switch context
    if (!options || !options.context) {
        db.clear()
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
        const { emitter } = options
        return (data: RecordData) => {
            if (!data) {
                return
            }
            if (emitter) {
                emitter(data, db)
                return
            }
            db.addRecord(data)
        }
    }

    const emit = onEmit(options)

    emit(getHeadData())
    iframeWatchers.forEach(watcher => {
        new watcher({
            context: (options && options.context) || window,
            emit
        })
    })

    await recordFrames()
}

export async function waitingFramesLoaded() {
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

export async function recordFrames() {
    const frames = await waitingFramesLoaded()
    frames.forEach(frameWindow => record({ context: frameWindow }))
}
