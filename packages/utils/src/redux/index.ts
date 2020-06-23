import { createStore } from './create-store'
import { combineReducers } from './combine-reducers'

import progressReducer from './reducers/progress'
import PlayerReducer from './reducers/player'

const reducer = combineReducers({
    player: PlayerReducer,
    progress: progressReducer
})

export { PlayerTypes } from './reducers/player'
export { ProgressTypes, ProgressState } from './reducers/progress'

export const reduxStore = createStore(reducer)
