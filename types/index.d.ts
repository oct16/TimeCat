declare module '*.html' {
    const value: string
    export default value
}
declare module '*.css' {
    const value: string
    export default value
}
declare module '*.scss' {
    const value: string
    export default value
}

declare interface EventTarget {
    result: any
    transaction: IDBTransaction
}

declare interface IDBDatabase {
    continue: Function
    value: any
}

declare interface HTMLInputElement {
    oldValue: string
    value: any
}

interface Window {
    HTMLElement: typeof HTMLElement
    HTMLInputElement: typeof HTMLInputElement
    HTMLInputElement: typeof HTMLInputElement
    HTMLSelectElement: typeof HTMLSelectElement
    HTMLTextAreaElement: typeof HTMLTextAreaElement
    HTMLOptionElement: typeof HTMLOptionElement
    Object: typeof Object

    G_RECORD_OPTIONS: any
    G_RECORD_RELATED_ID: string

    G_REPLAY_STR_RECORDS: string
    G_REPLAY_PACKS: any
    G_REPLAY_DATA: any
    G_REPLAY_RECORDS?: any
    G_REPLAY_OPTIONS: any
    G_REPLAY_LOCATION: any

    webkitAudioContext?: typeof AudioContext

    TimeCat: {
        record: (
            options: RecordOptions
        ) => {
            destroy: () => void
        }
        replay(options: { socketUrl: string } = {} as any): Promise<void>
        exportReplay(exportOptions: ExportOptions): Promise<void>
    }
}

interface Event {
    arguments: any
}
