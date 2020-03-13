import { snapshots, SnapshotData } from '@WebReplay/snapshot'
import { RecordOptions } from './types'
import { listenerStore } from '@WebReplay/utils'

const ctrl = {
    uninstall: () => {
        Array.from(listenerStore.values()).forEach(un => un())
    }
}

export const record = ({ emitter }: RecordOptions = {}) => {
    recordAll(emitter)
    return ctrl
}

function recordAll(emitter?: (e: SnapshotData) => void) {
    const recordTasks: Function[] = [...Object.values(snapshots)]

    recordTasks.forEach(task => {
        task(emitter)
    })
}
