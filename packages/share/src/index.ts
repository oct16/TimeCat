export type ValueOf<T> = T[keyof T]
export type ValueOfKey<T, K extends keyof T> = T[K]
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export interface InfoData {
    doctype: DocumentType
    href: string
    width: number
    height: number
    scrollLeft: number
    scrollTop: number
    frameId: number | null
}

export interface SnapshotData {
    type: RecordType.SNAPSHOT
    data: {
        vNode: VNode
    } & InfoData
    time: string
}

type Attrs = { [key: string]: string }

type Extra = {
    props?: {
        [key: string]: string | number | boolean | Object | undefined
        scroll?: { top: number; left: number }
    }
    isSVG?: boolean
}

type Children = (VNode | VSNode)[]

export interface VSNode {
    id: number
    type: number
    value: string
}

export interface VNode {
    type: number
    id: number
    tag: string
    attrs: Attrs
    children: Children
    extra: Extra
}

export enum RecordType {
    'SNAPSHOT',
    'WINDOW',
    'SCROLL',
    'MOUSE',
    'DOM',
    'FORM_EL',
    'LOCATION',
    'AUDIO',
    'CANVAS',
    'NONE'
}

export enum FormElementEvent {
    'PROP',
    'INPUT',
    'CHANGE',
    'FOCUS',
    'BLUR'
}
export enum MouseEventType {
    'MOVE',
    'CLICK'
}

export interface WindowRecord {
    type: RecordType.WINDOW
    data: WindowWatcherData
    time: string
}

export interface WindowWatcherData {
    id: number | null
    width: number
    height: number
}

export interface ScrollRecord {
    type: RecordType.SCROLL
    data: ScrollWatcherData
    time: string
}

export interface ScrollWatcherData {
    id: number | null
    top: number
    left: number
}

export interface MouseRecord {
    type: RecordType.MOUSE
    data: MouseRecordData
    time: string
}
export interface MouseRecordData {
    type: MouseEventType
    x: number
    y: number
    id?: number
}
export interface DOMRecord {
    type: RecordType.DOM
    data: DOMWatcherData
    time: string
}
export interface DOMWatcherData extends DOMUpdateDataType {}

export interface AttributesUpdateData {
    id: number
    value: string | boolean
    key: string
}

export interface CharacterDataUpdateData {
    parentId: number
    value: string
    id: number
}

export interface UpdateNodeData {
    parentId: number
    nextId: number | null
    node: VSNode | VNode | number
}

export interface movedNodesData {
    parentId: number
    id: number
    nextId: number | null
}

export interface RemoveUpdateData {
    parentId: number
    id: number
}

export interface DOMUpdateDataType {
    addedNodes: UpdateNodeData[]
    movedNodes: movedNodesData[]
    removedNodes: RemoveUpdateData[]
    attrs: AttributesUpdateData[]
    texts: CharacterDataUpdateData[]
}

export interface FormElementRecord {
    type: RecordType.FORM_EL
    data: FormElementWatcherData
    time: string
}

export interface FormElementWatcherData {
    type: FormElementEvent
    id: number
    key?: string
    value?: string
    patches?: FormElementStrPatches[]
}

interface FormElementStrPatches {
    index: number
    type: 'add' | 'rm'
    value?: string | undefined
    len?: number | undefined
}

export interface AudioRecord {
    type: RecordType.AUDIO
    data: AudioStrList | AudioOptions
    time: string
}
export interface AudioOptions {
    type: 'opts'
    data: RecorderOptions
}
export interface AudioStrList {
    type: 'base64'
    data: string[]
}

export interface NONERecord {
    type: RecordType.NONE
    data: null
    time: string
}

export interface LocationRecord {
    type: RecordType.LOCATION
    data: LocationRecordData
    time: string
}

export interface LocationRecordData {
    href: string
    path: string
    hash: string
    contextNodeId: number
}
export interface CanvasRecord {
    type: RecordType.CANVAS
    data: CanvasRecordData
    time: string
}

export type CanvasRecordData = CanvasMutationRecordData | CanvasInitRecordData

export interface CanvasMutationRecordData {
    id: number
    strokes: {
        name: keyof CanvasRenderingContext2D
        args: any[]
    }[]
}
export interface CanvasInitRecordData {
    id: number
    src: string
}

export type RecordEvent<T> = (e: T) => void

export type RecordData =
    | FormElementRecord
    | DOMRecord
    | MouseRecord
    | WindowRecord
    | ScrollRecord
    | AudioRecord
    | NONERecord
    | LocationRecord
    | CanvasRecord

export interface AudioData {
    src: string
    opts: RecorderOptions
    bufferStrList: string[]
    subtitles: SubtitlesData[]
}

interface SubtitlesData {
    start: string
    end: string
    text: string
}

export interface RecordOptions {
    mode?: 'live' | 'default'
    context?: Window
    audio?: boolean
    emitter?: (data: RecordData | SnapshotData, db: any) => void
    // emitter?: (data: RecordData, db: IndexedDBOperator) => void
}

export interface RecorderOptions {
    sampleBits: 8 | 16
    sampleRate: 8000 | 16000 | 22050 | 24000 | 44100 | 48000
    channelCount: 1 | 2
}

export type IRecorderStatus = 'PAUSE' | 'RECORDING' | 'STOP'

export interface ReplayOptions {
    mode?: 'live' | 'default'
    receiver?: (sender: (data: RecordData | SnapshotData) => void) => void
    proxy?: string
    autoplay?: boolean
    replayDataList?: ReplayData[]
    replayDataListName?: string
}

export interface ReplayData {
    index?: number
    snapshot: SnapshotData
    records: RecordData[]
    audio: AudioData
}

export enum TransactionMode {
    'READONLY' = 'readonly',
    'READWRITE' = 'readwrite',
    'VERSIONCHANGE' = 'versionchange'
}

export type WatcherOptions<T> = { context: Window; emit: RecordEvent<T> }
