import { isEqual } from 'lodash-es'

type State = { [key: string]: any }

function createStore(reducer: (state: State, action: { type: string; data: State }) => State) {
    let state: State
    const listeners: Array<(state: State, oldState?: State) => void> = []

    const subscribe = (listener: (state: State, oldState?: State) => void) => listeners.push(listener)
    const getState = () => state

    const dispatch = (action: { type: string; data: State }) => {
        const oldState = state
        state = reducer(state, action)
        if (!isEqual(state, oldState)) {
            listeners.forEach(listener => listener(state, oldState))
        }
    }

    dispatch({ type: 'INIT', data: {} })
    return { getState, dispatch, subscribe }
}

function reducer(state: State, action: { type: string; data: State }) {
    const { type, data } = action

    switch (type) {
        case 'PLAY':
            return {
                ...state,
                speed: Number(data.speed) || 0
            }
        default:
            return state
    }
}

export const Redux = createStore(reducer)
