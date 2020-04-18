import { snapshots, SnapshotData } from '@WebReplay/snapshot'
import { listenerStore, IndexedDBOperator, DBPromise } from '@WebReplay/utils'

const ctrl = {
    uninstall: () => {
        Array.from(listenerStore.values()).forEach(un => un())
    }
}

function recordAll(emitter?: (data: SnapshotData) => void) {
    const recordTasks: Function[] = [...Object.values(snapshots)]
    recordTasks.forEach(task => {
        task(emitter)
    })
}

export const record = (fn?: (data: SnapshotData, db: IndexedDBOperator) => void) => {
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
