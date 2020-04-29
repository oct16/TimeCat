import { VNode, VSNode } from '@WebReplay/virtual-dom'

export enum SnapshotType {
    'INFO' = 'INFO',
    'WINDOW' = 'WINDOW',
    'DOM' = 'DOM',
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

export interface InfoObserve {
    type: SnapshotType.INFO
    data: InfoData
    time: string
}
export interface WindowObserve {
    type: SnapshotType.WINDOW
    data: WindowObserveData
    time: string
}
export interface InfoData {
    doctype: DocumentType
    origin: string
    pathname: string
}
export interface WindowObserveData {
    width: number
    height: number
    scrollTop: number
    scrollLeft: number
}

export interface DOMSnapshot {
    type: SnapshotType.DOM
    data: DOMSnapshotData
    time: string
}

export interface DOMSnapshotData {
    vNode: VNode
}
export interface MouseSnapshot {
    type: SnapshotType.MOUSE
    data: MouseSnapshotData
    time: string
}
export interface MouseSnapshotData {
    type: MouseEventType
    x: number
    y: number
    id?: number
}
export interface DOMObserve {
    type: SnapshotType.DOM_UPDATE
    data: DOMObserveData
    time: string
}
export interface DOMObserveData extends DOMUpdateDataType {}

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

export interface FormElementObserve {
    type: SnapshotType.FORM_EL_UPDATE
    data: FormElementObserveData
    time: string
}

export interface FormElementObserveData {
    type: FormElementEvent
    id: number
    key?: string
    value?: string
}

export type SnapshotEvent<T> = (e: T) => void

export type SnapshotData = FormElementObserve | DOMObserve | MouseSnapshot | DOMSnapshot | WindowObserve | InfoObserve
