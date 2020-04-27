import { State } from '../types'

const initState = {
    frame: 0,
    length: 0,
    curTime: 0,
    startTime: 0,
    endTime: 0
}

export type ProgressState = typeof initState

export enum ProgressTypes {
    FORWARD = 'FORWARD',
    BACKWARD = 'BACKWARD',
    INFO = 'INFO'
}

export default function progressReducer(state: State, action?: { type: string; data: State }) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case ProgressTypes.FORWARD:
            return {
                ...state,
                frame: data.frame,
                curTime: data.curTime
            }
        case ProgressTypes.BACKWARD:
            return {
                ...state,
                frame: data.frame
            }
        case ProgressTypes.INFO:
            return {
                ...state,
                ...data
            }
        default:
            return state
    }
}
