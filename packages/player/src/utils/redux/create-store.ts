import { Action, State, RootReducer } from './types'

export function createStore(reducer: RootReducer) {
    let state = reducer({} as State)
    const listeners: Array<(state: State) => void> = []

    function unsubscribe() {}

    function subscribe(listener: (state: State) => void): void {
        listeners.push(listener)
    }

    function dispatch(action: Action) {
        state = reducer(state, action)

        listeners.forEach(listener => {
            listener(state)
        })
    }

    function getState(): State {
        return state
    }

    return {
        unsubscribe,
        subscribe,
        dispatch,
        getState
    }
}
