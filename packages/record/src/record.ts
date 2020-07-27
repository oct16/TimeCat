import { watchers } from './watchers'
import { recordAudio } from './audio'
import { RecordData, RecordOptions, SnapshotData, ValueOf, WatcherOptions } from '@timecat/share'
import { uninstallStore, getDBOperator } from '@timecat/utils'
import { snapshots } from '@timecat/snapshot'

function getSnapshotData(options: WatcherOptions<SnapshotData>): void {
    const { DOMSnapshot } = snapshots
    const snapshot = DOMSnapshot(options.context || window)
    const { emit } = options
    emit(snapshot)
}

function getRecorders(options: RecordOptions) {
    const recorders: Array<typeof getSnapshotData | ValueOf<typeof watchers> | typeof recordAudio> = [
        getSnapshotData,
        ...Object.values(watchers)
    ]
    if (options && options.audio) {
        recorders.push(recordAudio)
    }
    return recorders
}

export const record = (options: RecordOptions) => {
    startRecord(options)
    return {
        unsubscribe: () => {
            Array.from(uninstallStore.values()).forEach(un => un())
        }
    }
}

async function startRecord(options: RecordOptions) {
    const db = await getDBOperator

    const allRecorders = getRecorders(options)
    let iframeRecorders = allRecorders

    // is record iframe, switch context
    if (!options || !options.context) {
        db.clear()
    } else {
        iframeRecorders = [
            getSnapshotData,
            watchers.MouseWatcher,
            watchers.DOMWatcher,
            watchers.FormElementWatcher,
            watchers.ScrollWatcher
        ]
    }

    iframeRecorders.forEach(task =>
        task({
            context: (options && options.context) || window,
            emit(data: RecordData | SnapshotData) {
                if (options && options.emitter) {
                    options.emitter(data, db)
                    return
                }
                db.add(data)
            }
        })
    )

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
                console.error(`TimeCat Error: Can't record from cross-origin frame`)
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
