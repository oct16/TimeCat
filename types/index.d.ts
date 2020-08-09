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
    Object: typeof Object

    __ReplayStrPacks__: string

    __ReplayPacks__: any

    __ReplayData__: any

    __RecordOptions__: any
    __ReplayOptions__: any

    __ReplayLocation__: any

    webkitAudioContext?: typeof AudioContext

    timecat: {
        record: (
            options: RecordOptions
        ) => {
            unsubscribe: () => void
        }
        replay(options: { socketUrl: string } = {} as any): Promise<void>
        exportReplay(exportOptions: ExportOptions): Promise<void>
    }
}

interface Event {
    arguments: any
}
