import { snapshot } from '@WebReplay/snapshot'
import { RecordOptions, RecordEvent } from './types'

export const record = ({ emitter }: RecordOptions = {}) => {
    recordAll(emitter)
}

function recordAll(emitter?: (e: RecordEvent) => void) {
    const recordTasks: Function[] = [snapshot.windowSnapshot, snapshot.DOMSnapshot, snapshot.listenMouse]

    recordTasks.forEach(task => {
        task(emitter)
    })
}

// function transformToRecordData() {

// }
