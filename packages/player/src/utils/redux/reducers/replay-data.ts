/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { RecordData, ReplayData, RecordType } from '@timecat/share'

function getPacks(records: RecordData[]) {
    const packs: RecordData[][] = []
    const pack: RecordData[] = []

    records.forEach((record, i) => {
        if (i && record.type === RecordType.HEAD) {
            packs.push(pack.slice())
            pack.length = 0
        }
        pack.push(record)

        if (records.length - 1 === i) {
            packs.push(pack)
        }
    })
    return packs
}

const initState = {
    records: [] as RecordData[],
    packs: [] as RecordData[][],
    currentData: {} as ReplayData
}

export type ReplayDataState = typeof initState

export enum ReplayDataReducerTypes {
    RESET = 'RESET',
    UPDATE_DATA = 'UPDATE_DATA',
    APPEND_RECORDS = 'APPEND_RECORDS'
}

export function ReplayDataReducer(
    state: typeof initState,
    action: { type: ReplayDataReducerTypes; data: Partial<typeof initState> }
) {
    if (!state) {
        state = initState
    }

    if (!action) {
        return state
    }

    const { type, data } = action

    switch (type) {
        case ReplayDataReducerTypes.APPEND_RECORDS:
            const records = state.records
            records.push(...data.records!)
            const packs = getPacks(records)
            state.packs = packs
            return state
        case ReplayDataReducerTypes.UPDATE_DATA:
            if (data.currentData && data.currentData) {
                window.G_REPLAY_DATA = data.currentData
            }
            return {
                ...state,
                ...data
            }
        case ReplayDataReducerTypes.RESET:
            return { ...initState }
        default:
            return state
    }
}
