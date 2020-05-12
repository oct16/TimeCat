import { VNode } from '@TimeCat/virtual-dom'

export interface InfoData {
    doctype: DocumentType
    origin: string
    pathname: string
    width: number
    height: number
    scrollLeft: number
    scrollTop: number
}

export interface DOMSnapshotData {
    vNode: VNode
}

export type SnapshotData = DOMSnapshotData & InfoData
