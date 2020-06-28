import { PlayerState } from './reducers/player'
import { ProgressState } from './reducers/progress'
import { ValueOf } from '@timecat/share'

export type Action = { type: string; data: ValueOf<States> }
export type Reducer = (state: States, action?: Action) => States
export type StateMap = { player: PlayerState; progress: ProgressState }
export type States = Partial<StateMap>
export type TopicName = keyof States
