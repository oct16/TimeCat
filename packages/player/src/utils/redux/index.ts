import { createStore } from './create-store'
import { combineReducers } from './combine-reducers'
import { ProgressReducer } from './reducers/progress'
import { PlayerReducer } from './reducers/player'
import { ReplayDataReducer } from './reducers/replay-data'

const reducer = combineReducers({
    player: PlayerReducer,
    progress: ProgressReducer,
    replayData: ReplayDataReducer
})

export const Store = createStore(reducer)
export * from './reducers'
