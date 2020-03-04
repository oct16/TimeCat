import { snapshot } from '@WebReplay/snapshot'
import { RecordOptions, RecordEvent } from './types'

export const record = ({ emitter }: RecordOptions = {}) => {
    recordAll(emitter)
}

function recordAll(emitter?: (e: RecordEvent) => void) {
    const recordTasks: Function[] = [...Object.values(snapshot)]

    recordTasks.forEach(task => {
        task(emitter)
    })
}
