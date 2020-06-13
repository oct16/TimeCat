import { VNode, VSNode } from '@TimeCat/virtual-dom'
import { IndexedDBOperator } from '@TimeCat/utils'

export enum RecordType {
    'WINDOW' = 'WINDOW',
    'SCROLL' = 'SCROLL',
    'MOUSE' = 'MOUSE',
    'DOM_UPDATE' = 'DOM_UPDATE',
    'FORM_EL_UPDATE' = 'FORM_EL_UPDATE',
    'AUDIO' = 'AUDIO'
}

export enum FormElementEvent {
    'PROP' = 'PROP',
    'INPUT' = 'INPUT',
    'CHANGE' = 'CHANGE',
    'FOCUS' = 'FOCUS',
    'BLUR' = 'BLUR'
}
export enum MouseEventType {
    'MOVE' = 'MOVE',
    'CLICK' = 'click'
}

export interface WindowRecord {
    type: RecordType.WINDOW
    data: WindowWatcherData
    time: string
}

export interface WindowWatcherData {
    id: number
    width: number
    height: number
}

export interface ScrollRecord {
    type: RecordType.SCROLL
    data: ScrollWatcherData
    time: string
}

export interface ScrollWatcherData {
    id: number
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
    type: RecordType.DOM_UPDATE
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
    type: RecordType.FORM_EL_UPDATE
    data: FormElementWatcherData
    time: string
}

export interface FormElementWatcherData {
    type: FormElementEvent
    id: number
    key?: string
    value?: string
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

export type RecordEvent<T> = (e: T) => void

export type RecordData = FormElementRecord | DOMRecord | MouseRecord | WindowRecord | ScrollRecord | AudioRecord

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
    audio?: boolean
    emitter?: (data: RecordData, db: IndexedDBOperator) => void
}

export interface RecorderOptions {
    sampleBits: 8 | 16
    sampleRate: 8000 | 16000 | 22050 | 24000 | 44100 | 48000
    channelCount: 1 | 2
}

export type IRecorderStatus = 'PAUSE' | 'RECORDING' | 'STOP'
