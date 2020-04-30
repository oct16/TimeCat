import { VNode, VSNode } from '@WebReplay/virtual-dom'

export enum RecordType {
    'WINDOW' = 'WINDOW',
    'MOUSE' = 'MOUSE',
    'DOM_UPDATE' = 'DOM_UPDATE',
    'FORM_EL_UPDATE' = 'FORM_EL_UPDATE'
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

export interface WindowWatcher {
    type: RecordType.WINDOW
    data: WindowWatcherData
    time: string
}

export interface WindowWatcherData {
    width: number
    height: number
    scrollTop: number
    scrollLeft: number
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
export interface DOMWatcher {
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

export interface RemoveUpdateData {
    parentId: number
    id: number
}

export interface DOMUpdateDataType {
    addedNodes: UpdateNodeData[]
    removedNodes: RemoveUpdateData[]

    attrs: AttributesUpdateData[]
    texts: CharacterDataUpdateData[]
}

export interface FormElementWatcher {
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

export type RecordEvent<T> = (e: T) => void

export type RecordData = FormElementWatcher | DOMWatcher | MouseRecord | WindowWatcher
