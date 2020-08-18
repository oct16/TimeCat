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

export interface SnapshotRecord {
    type: RecordType.SNAPSHOT
    data: {
        vNode: VNode
    } & InfoData
    time: string
}

type Extra = {
    props?: {
        [key: string]: string | number | boolean | Object | undefined
        scroll?: { top: number; left: number }
    }
    isSVG?: boolean
}

type Children = (VNode | VSNode)[]

type Attrs = { [key: string]: string }

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
    'HEAD',
    'SNAPSHOT',
    'WINDOW',
    'SCROLL',
    'MOUSE',
    'DOM',
    'FORM_EL',
    'LOCATION',
    'AUDIO',
    'CANVAS',
    'TERMINATE'
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

export interface TerminateRecord {
    type: RecordType.TERMINATE
    data: null
    time: string
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
export type DOMWatcherData = DOMUpdateDataType

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

export type RecordEvent<T extends RecordData> = (e: T) => void

export type DBRecordData = { id: number } & RecordData

export type RecordData =
    | HeadRecord
    | SnapshotRecord
    | FormElementRecord
    | DOMRecord
    | MouseRecord
    | WindowRecord
    | ScrollRecord
    | AudioRecord
    | LocationRecord
    | CanvasRecord
    | TerminateRecord

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
    skip?: boolean
    uploadUrl?: string
    onData?: (data: RecordData, db: any) => RecordData | void
}

export interface RecorderOptions {
    sampleBits: 8 | 16
    sampleRate: 8000 | 16000 | 22050 | 24000 | 44100 | 48000
    channelCount: 1 | 2
}

export type IRecorderStatus = 'PAUSE' | 'RECORDING' | 'STOP'

export enum TransactionMode {
    'READONLY' = 'readonly',
    'READWRITE' = 'readwrite',
    'VERSIONCHANGE' = 'versionchange'
}

export type WatcherOptions<T extends RecordData | HeadRecord> = {
    context: Window
    reverseStore: Set<Function>
    emit: RecordEvent<T>
}

export interface Constructable<T> {
    new (...args: any): T
}

export interface ReplayOptions {
    mode?: 'live' | 'default'
    fetch?: { url: string; options?: RequestInit }
    receiver?: (sender: (data: RecordData) => void) => void
    proxy?: string
    autoplay?: boolean
    replayPacks?: ReplayPack[]
}

export interface ReplayPack {
    head: ReplayHead
    body: ReplayData[]
}

export interface ReplayData {
    index?: number
    snapshot: SnapshotRecord
    records: RecordData[]
    audio: AudioData
}

export interface ReplayHead {
    version: string
    href: string
    sessionId: string
    userAgent: string
    platform: string
    beginTime: string
    endTime?: string
    extra?: {
        [key: string]: string
    }
}

export interface HeadRecord {
    type: RecordType.HEAD
    data: ReplayHead
    time: string
}
