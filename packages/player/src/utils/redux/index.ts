import { createStore } from './create-store'
import { combineReducers } from './combine-reducers'
import ProgressReducer from './reducers/progress'
import PlayerReducer from './reducers/player'

const reducer = combineReducers({
    player: PlayerReducer,
    progress: ProgressReducer
})

export const Store = createStore(reducer)
