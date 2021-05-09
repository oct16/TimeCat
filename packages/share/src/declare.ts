/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ReplayData, LocationRecordData, RecordData } from '.'

declare global {
    interface Window {
        G_RECORD_OPTIONS: any
        G_RECORD_RELATED_ID: string
        G_REPLAY_RECORDS: RecordData[]
        G_REPLAY_STR_RECORDS: string
        G_REPLAY_DATA: ReplayData
        G_REPLAY_LOCATION: LocationRecordData
        Object: typeof Object

        HTMLElement: typeof HTMLElement
        HTMLInputElement: typeof HTMLInputElement
        HTMLSelectElement: typeof HTMLSelectElement
        HTMLTextAreaElement: typeof HTMLTextAreaElement
        HTMLOptionElement: typeof HTMLOptionElement

        webkitAudioContext?: typeof AudioContext
    }

    interface Document {
        createElement(tagName: string, xx: boolean): HTMLElement
    }

    interface IDBDatabase {
        continue: Function
        value: any
    }

    interface EventTarget {
        result?: any
    }

    interface Event {
        arguments: any
    }

    interface HTMLInputElement {
        oldValue: string
        value: string
    }

    interface HTMLCanvasElement {
        captureStream(frameRate?: number): MediaStream
    }
}

export {}
