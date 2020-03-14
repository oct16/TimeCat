import { State } from '../create-store'

let initState = {
    speed: null
}

export enum PlayerTypes {
    SPEED = 'SPEED'
}

export type PlayerState = typeof PlayerTypes

export default function playerReducer(state: State, action: any) {
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
