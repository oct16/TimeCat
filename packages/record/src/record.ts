import { watchers } from './watcher'
import { recordAudio } from './audio'
import { RecordData, RecordEvent, RecordOptions, SnapshotData, ValueOf } from '@timecat/share'
import { listenerStore, getDBOperator, GS } from '@timecat/utils'
import { snapshots } from '@timecat/snapshot'

function getSnapshotData(emit: RecordEvent<SnapshotData>): void {
    const { DOMSnapshot } = snapshots
    const snapshot = DOMSnapshot()
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
            Array.from(listenerStore.values()).forEach(un => un())
        }
    }
}

async function startRecord(options: RecordOptions) {
    const db = await getDBOperator

    const allRecorders = getRecorders(options)
    let activeRecorders = allRecorders
    // refer the iframe global variable
    if (!options || !options.window) {
        db.clear()
        GS.default()
    } else {
        activeRecorders = [
            getSnapshotData,
            watchers.MouseRecord,
            watchers.DOMRecord,
            watchers.FormElementRecord,
            watchers.ScrollRecord
        ]
        GS.switch(options.window)
    }

    activeRecorders.forEach(task =>
        task((data: RecordData | SnapshotData) => {
            if (options && options.emitter) {
                options.emitter(data, db)
                return
            }
            db.add(data)
        })
    )

    await recordFrames()
}

export async function waitingFramesLoaded() {
    const frames = window.currentWindow.frames
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
    frames.forEach(frame => record({ window: frame }))
}
