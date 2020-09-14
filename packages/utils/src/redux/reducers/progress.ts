const initState = {
    frame: 0,
    length: 0,
    curTime: 0,
    startTime: 0,
    endTime: 0
}

export type ProgressState = typeof initState

export enum ProgressTypes {
    RESET = 'RESET',
    FORWARD = 'FORWARD',
    BACKWARD = 'BACKWARD',
    INFO = 'INFO'
}

export default function progressReducer(state: ProgressState, action?: { type: string; data: Partial<ProgressState> }) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case ProgressTypes.RESET:
            return initState
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
