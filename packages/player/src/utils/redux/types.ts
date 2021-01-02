/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PlayerState } from './reducers/player'
import { ProgressState } from './reducers/progress'
import { ReplayDataState } from './reducers/replay-data'
import { ValueOf } from '@timecat/share'

export type Action = { type: string; data: Partial<ValueOf<State>> }
export type Reducer<T> = (state: T, action?: Action) => T
export type SubReducer = Reducer<ValueOf<State>>
export type RootReducer = Reducer<State>
export type State = { player: PlayerState; progress: ProgressState; replayData: ReplayDataState }
