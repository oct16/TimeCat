import { createStore } from './create-store'
import { combineReducers } from './combine-reducers'

import progressReducer from './reducers/progress'
import playerReducer from './reducers/player'

const reducer = combineReducers({
    player: playerReducer,
    progress: progressReducer
})

export { PlayerTypes, PlayerState } from './reducers/player'
export { ProgressTypes, ProgressState } from './reducers/progress'

export const reduxStore = createStore(reducer)
