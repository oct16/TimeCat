import { ReplayPack, ReplayData, RecordData, ReplayOptions, LocationRecordData, RecordOptionsBase } from '.'

declare global {
    interface Window {
        G_RECORD_OPTIONS: RecordOptionsBase
        G_RECORD_RELATED_ID: string
        G_REPLAY_STR_RECORDS: string
        G_REPLAY_PACKS: ReplayPack[]
        G_REPLAY_DATA: ReplayData
        G_REPLAY_RECORDS?: RecordData[]
        G_REPLAY_OPTIONS: ReplayOptions
        G_REPLAY_LOCATION: LocationRecordData
        Object: typeof Object

        HTMLElement: typeof HTMLElement
        HTMLInputElement: typeof HTMLInputElement
        HTMLSelectElement: typeof HTMLSelectElement
        HTMLTextAreaElement: typeof HTMLTextAreaElement
        HTMLOptionElement: typeof HTMLOptionElement

        webkitAudioContext?: typeof AudioContext
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
}

export {}
