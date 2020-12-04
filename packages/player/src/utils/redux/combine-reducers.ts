import { Action, SubReducer } from './types'
import { State } from './types'
export function combineReducers(reducers: { [key: string]: SubReducer }) {
    const reducerKeys = Object.keys(reducers)
    return function combination(state: State, action: Action) {
        const nextState = {} as State

        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i] as keyof State

            const reducer = reducers[key]

            const previousStateForKey = state[key]

            const nextStateForKey = reducer(previousStateForKey, action)

            nextState[key] = nextStateForKey as any
        }
        return nextState
    }
}
