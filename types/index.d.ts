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

    __ReplayStrData__: string

    __ReplayDataList__: ReplayData[]

    __ReplayData__: ReplayData

    __RecordOptions__: RecordOptions
    __ReplayOptions__: ReplayOptions

    __ReplayLocation__: LocationRecordData

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

declare interface ReplayData {
    index?: number
    snapshot: SnapshotData
    records: RecordData[]
    audio: AudioData
}

declare interface LocationRecordData {
    href: string
    path: string
    hash: string
    contextNodeId: number
}
declare interface AudioData {
    src: string
    opts: RecorderOptions
    bufferStrList: string[]
    subtitles: SubtitlesData[]
}

declare interface SubtitlesData {
    start: string
    end: string
    text: string
}

declare interface AttributesUpdateData {
    id: number
    value: string | boolean
    key: string
}

declare type Attrs = {
    [key: string]: string
}

declare interface AudioOptions {
    type: 'opts'
    data: RecorderOptions
}

declare interface AudioRecord {
    type: RecordType.AUDIO
    data: AudioStrList | AudioOptions
    time: string
}

declare interface AudioStrList {
    type: 'base64'
    data: string[]
}

declare interface CanvasInitRecordData {
    id: number
    src: string
}

declare interface CanvasMutationRecordData {
    id: number
    strokes: {
        name: keyof CanvasRenderingContext2D
        args: any[]
    }[]
}

declare interface CanvasRecord {
    type: RecordType.CANVAS
    data: CanvasRecordData
    time: string
}

declare type CanvasRecordData = CanvasMutationRecordData | CanvasInitRecordData

declare interface CharacterDataUpdateData {
    parentId: number
    value: string
    id: number
}

declare type Children = (VNode | VSNode)[]

declare interface DOMRecord {
    type: RecordType.DOM
    data: DOMWatcherData
    time: string
}

declare interface DOMUpdateDataType {
    addedNodes: UpdateNodeData[]
    movedNodes: movedNodesData[]
    removedNodes: RemoveUpdateData[]
    attrs: AttributesUpdateData[]
    texts: CharacterDataUpdateData[]
}

declare interface DOMWatcherData extends DOMUpdateDataType {}

declare type ExportOptions = {
    scripts?: ScriptItem[]
    autoplay?: boolean
    audioExternal?: boolean
    dataExternal?: boolean
}

declare type Extra = {
    props?: {
        [key: string]: string | number | boolean | Object | undefined
        scroll?: {
            top: number
            left: number
        }
    }
    isSVG?: boolean
}

declare enum FormElementEvent {
    'PROP' = 0,
    'INPUT' = 1,
    'CHANGE' = 2,
    'FOCUS' = 3,
    'BLUR' = 4
}

declare interface FormElementRecord {
    type: RecordType.FORM_EL
    data: FormElementWatcherData
    time: string
}

declare interface FormElementStrPatches {
    index: number
    type: 'add' | 'rm'
    value?: string | undefined
    len?: number | undefined
}

declare interface FormElementWatcherData {
    type: FormElementEvent
    id: number
    key?: string
    value?: string
    patches?: FormElementStrPatches[]
}

declare interface InfoData {
    doctype: DocumentType
    href: string
    width: number
    height: number
    scrollLeft: number
    scrollTop: number
    frameId: number | null
}

declare interface LocationRecord {
    type: RecordType.LOCATION
    data: LocationRecordData
    time: string
}

declare interface LocationRecordData {
    href: string
    path: string
    hash: string
    contextNodeId: number
}

declare enum MouseEventType {
    'MOVE' = 0,
    'CLICK' = 1
}

declare interface MouseRecord {
    type: RecordType.MOUSE
    data: MouseRecordData
    time: string
}

declare interface MouseRecordData {
    type: MouseEventType
    x: number
    y: number
    id?: number
}

declare interface movedNodesData {
    parentId: number
    id: number
    nextId: number | null
}

declare interface NONERecord {
    type: RecordType.NONE
    data: null
    time: string
}

declare type RecordData =
    | FormElementRecord
    | DOMRecord
    | MouseRecord
    | WindowRecord
    | ScrollRecord
    | AudioRecord
    | NONERecord
    | LocationRecord
    | CanvasRecord

declare interface RecorderOptions {
    sampleBits: 8 | 16
    sampleRate: 8000 | 16000 | 22050 | 24000 | 44100 | 48000
    channelCount: 1 | 2
}

declare interface RecordOptions {
    mode?: 'live' | 'default'
    context?: Window
    audio?: boolean
    emitter?: (data: RecordData | SnapshotData, db: any) => void
}

declare enum RecordType {
    'SNAPSHOT' = 0,
    'WINDOW' = 1,
    'SCROLL' = 2,
    'MOUSE' = 3,
    'DOM' = 4,
    'FORM_EL' = 5,
    'LOCATION' = 6,
    'AUDIO' = 7,
    'CANVAS' = 8,
    'NONE' = 9
}

declare interface RemoveUpdateData {
    parentId: number
    id: number
}

declare interface ReplayOptions {
    mode?: 'live' | 'default'
    receiver?: (sender: (data: RecordData | SnapshotData) => void) => void
    proxy?: string
    autoplay?: boolean
}

declare type ScriptItem = {
    name?: string
    src: string
}

declare interface ScrollRecord {
    type: RecordType.SCROLL
    data: ScrollWatcherData
    time: string
}

declare interface ScrollWatcherData {
    id: number | null
    top: number
    left: number
}

declare interface SnapshotData {
    type: RecordType.SNAPSHOT
    data: {
        vNode: VNode
    } & InfoData
    time: string
}

declare interface UpdateNodeData {
    parentId: number
    nextId: number | null
    node: VSNode | VNode | number
}

declare interface VNode {
    type: number
    id: number
    tag: string
    attrs: Attrs
    children: Children
    extra: Extra
}

declare interface VSNode {
    id: number
    type: number
    value: string
}

declare interface WindowRecord {
    type: RecordType.WINDOW
    data: WindowWatcherData
    time: string
}

declare interface WindowWatcherData {
    id: number | null
    width: number
    height: number
}
