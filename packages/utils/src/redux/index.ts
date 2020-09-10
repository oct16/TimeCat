import { createStore } from './create-store'
import { combineReducers } from './combine-reducers'
import progressReducer from './reducers/progress'
import PlayerReducer from './reducers/player'
import { Action, Reducer, StateMap } from './types'
import { ValueOfKey } from '@timecat/share/src'

const reducer = combineReducers({
    player: PlayerReducer,
    progress: progressReducer
} as { [key: string]: Reducer })

export { PlayerTypes } from './reducers/player'
export { ProgressTypes, ProgressState } from './reducers/progress'

// TODO
// the return type was added for fix warning: The expression contains an import() type, which is not yet supported by API Extractor
export const reduxStore = createStore(reducer) as {
    unsubscribe: () => void
    subscribe: {
        <T extends 'player' | 'progress', S extends ValueOfKey<StateMap, T>>(
            type: T,
            listener: (state: S) => void
        ): void
        (listener: (state: StateMap) => void): void
    }
    dispatch: (action: Action) => void
    getState: {
        (): StateMap
        <T extends 'player' | 'progress'>(name?: T | undefined): StateMap[T]
    }
}
