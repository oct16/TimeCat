const initState = {
    speed: 0
}

export type PlayerState = typeof initState

export enum PlayerTypes {
    SPEED = 'SPEED'
}

export default function PlayerReducer(
    state: typeof initState,
    action: { type: string; data: Partial<typeof initState> }
) {
    if (!state) {
        state = initState
    }
    if (!action) {
        return state
    }
    const { type, data } = action

    switch (type) {
        case PlayerTypes.SPEED:
            return {
                ...state,
                ...data
            }
        default:
            return state
    }
}
