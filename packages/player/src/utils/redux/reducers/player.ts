/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ReplayOptions } from '@timecat/share'

const initState = {
    speed: 0,
    options: {} as ReplayOptions
}

export type PlayerState = typeof initState

export enum PlayerReducerTypes {
    RESET = 'RESET',
    SPEED = 'SPEED',
    OPTIONS = 'OPTIONS'
}

export function PlayerReducer(
    state: typeof initState,
    action: { type: PlayerReducerTypes; data: Partial<typeof initState> }
) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case PlayerReducerTypes.OPTIONS:
            return {
                ...state,
                options: data.options!
            }
        case PlayerReducerTypes.SPEED:
            return {
                ...state,
                speed: data.speed!
            }
        case PlayerReducerTypes.RESET:
            return { ...initState }
        default:
            return state
    }
}
