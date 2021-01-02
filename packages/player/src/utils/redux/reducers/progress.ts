/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const initState = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    packsInfo: [] as {
        startTime: number
        endTime: number
        duration: number
        diffTime: number
    }[]
}

export type ProgressState = typeof initState

export enum ProgressReducerTypes {
    PROGRESS = 'PROGRESS'
}

export function ProgressReducer(state: ProgressState, action: { type: string; data: Partial<ProgressState> }) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case ProgressReducerTypes.PROGRESS:
            return {
                ...state,
                ...data
            }
        default:
            return state
    }
}
