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

export type SnapshotRecord = BaseRecord<RecordType.SNAPSHOT, { vNode: VNode } & InfoData>

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

export type TerminateRecord = BaseRecord<TerminateRecord, null>

export type WindowRecord = BaseRecord<RecordType.WINDOW, WindowRecordData>

export interface WindowRecordData {
    id: number | null
    width: number
    height: number
}

export type ScrollRecord = BaseRecord<RecordType.SCROLL, ScrollRecordData>

export interface ScrollRecordData {
    id: number | null
    top: number
    left: number
}

export type MouseRecord = BaseRecord<RecordType.MOUSE, MouseRecordData>
export interface MouseRecordData {
    type: MouseEventType
    x: number
    y: number
    id?: number
}

export type DOMRecord = BaseRecord<RecordType.DOM, DOMRecordData>

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

export interface DOMRecordData {
    addedNodes?: UpdateNodeData[]
    movedNodes?: movedNodesData[]
    removedNodes?: RemoveUpdateData[]
    attrs?: AttributesUpdateData[]
    texts?: CharacterDataUpdateData[]
}

export type FormElementRecord = BaseRecord<RecordType.FORM_EL, FormElementRecordData>

export interface FormElementRecordData {
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

export type AudioRecord = BaseRecord<RecordType.AUDIO, AudioStrList | AudioOptions>
export interface AudioOptions {
    type: 'opts'
    data: RecorderOptions
}
export interface AudioStrList {
    type: 'base64'
    data: string[]
}

export type LocationRecord = BaseRecord<RecordType.LOCATION, LocationRecordData>

export interface LocationRecordData {
    href: string
    path: string
    hash: string
    contextNodeId: number
}
export type CanvasRecord = BaseRecord<RecordType.CANVAS, CanvasRecordData>

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
    relatedId: string
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
    packs?: ReplayPack[]
    records?: RecordData[]
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
    relatedId: string
    userAgent: string
    platform: string
    beginTime: string
    endTime?: string
    extra?: {
        [key: string]: string
    }
}

export type HeadRecord = BaseRecord<RecordType.HEAD, ReplayHead>

export interface BaseRecord<T, D = any> {
    type: T
    data: D
    time: string
    relatedId: string
}
