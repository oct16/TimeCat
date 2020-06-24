import { watchers } from './watcher'
import { recordAudio } from './audio'
import { RecordData, RecordEvent, RecordOptions, SnapshotData } from '@timecat/share'
import { listenerStore, getDBOperator } from '@timecat/utils'
import { snapshots } from '@timecat/snapshot'
const ctrl = {
    unsubscribe: () => {
        Array.from(listenerStore.values()).forEach(un => un())
    }
}

function getSnapshotData(emit: RecordEvent<SnapshotData>): void {
    const { getInitInfo, DOMSnapshot } = snapshots
    const initInfo = getInitInfo()
    const snapshot = DOMSnapshot()
    emit({ ...initInfo, ...snapshot })
}

function getRecorders(options: RecordOptions) {
    const recorders: Function[] = [getSnapshotData, ...Object.values(watchers)]
    if (options) {
        const { audio } = options
        if (audio) {
            recorders.push(recordAudio)
        }
    }
    return recorders
}

export const record = (options: RecordOptions) => {
    getDBOperator.then(db => {
        db.clear()
        getRecorders(options).forEach(task =>
            task((data: RecordData & SnapshotData) => {
                if (options && options.emitter) {
                    options.emitter(data, db)
                    return
                }
                db.add(data)
            })
        )
    })
    return ctrl
}
