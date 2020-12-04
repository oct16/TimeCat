const initState = {
    frames: 0,
    startTime: 0,
    endTime: 0
}

export type ProgressState = typeof initState

export enum ProgressTypes {
    PROGRESS = 'PROGRESS'
}

export default function ProgressReducer(state: ProgressState, action: { type: string; data: Partial<ProgressState> }) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case ProgressTypes.PROGRESS:
            return {
                ...state,
                ...data
            }
        default:
            return state
    }
}
