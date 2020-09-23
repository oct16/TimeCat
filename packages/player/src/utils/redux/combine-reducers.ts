import { Reducer, Action, States, TopicName } from './types'

export function combineReducers(reducers: { [key: string]: Reducer }) {
    const reducerKeys = Object.keys(reducers)
    return function combination(state: States, action?: Action) {
        const nextState = {} as States

        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i] as TopicName // reducer name

            const reducer = reducers[key]

            const previousStateForKey = state[key] as States

            const nextStateForKey = reducer(previousStateForKey, action)

            nextState[key] = nextStateForKey as any
        }
        return nextState
    }
}
