import { watchers } from './watcher'
import { RecordData, RecordEvent } from './types'
import { listenerStore, IndexedDBOperator, DBPromise } from '@TimeCat/utils'
import { snapshots, SnapshotData } from '@TimeCat/snapshot'
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

function recordAll(emitter?: (data: RecordData & SnapshotData) => void) {
    const recordTasks: Function[] = [getSnapshotData, ...Object.values(watchers)]
    recordTasks.forEach(task => task(emitter))
}

export const record = (fn?: (data: RecordData, db: IndexedDBOperator) => void) => {
    DBPromise.then(db => {
        db.clear()
        recordAll(data => {
            if (fn) {
                fn(data, db)
                return
            }
            db.add(data)
        })
    })
    return ctrl
}
