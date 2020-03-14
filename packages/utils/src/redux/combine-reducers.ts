import { State } from './create-store'

export type Action = { type: string; state: State }
export type Reducer = (state: State, action?: Action) => State

export function combineReducers(reducers: { [key: string]: Reducer }) {
    const reducerKeys = Object.keys(reducers)
    return function combination(state: State, action?: Action) {
        const nextState = {} as State

        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i] // reducer name

            const reducer = reducers[key]

            const previousStateForKey = state[key]

            const nextStateForKey = reducer(previousStateForKey, action)

            nextState[key] = nextStateForKey
        }
        return nextState
    }
}
