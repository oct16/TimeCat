import { snapshot, SnapshotData } from '@WebReplay/snapshot'
import { RecordOptions } from './types'

export const record = ({ emitter }: RecordOptions = {}) => {
    recordAll(emitter)
}

function recordAll(emitter?: (e: SnapshotData) => void) {
    const recordTasks: Function[] = [...Object.values(snapshot)]

    recordTasks.forEach(task => {
        task(emitter)
    })
}
