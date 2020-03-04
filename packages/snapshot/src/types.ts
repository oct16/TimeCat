export enum SnapshotType {
    'WINDOW' = 'WINDOW',
    'DOM' = 'DOM',
    'MOUSE' = 'MOUSE',
    'DOM_UPDATE' = 'DOM_UPDATE',
    'FORM_EL_UPDATE' = 'FORM_EL_UPDATE'
}

export enum FormElementEvent {
    'INPUT' = 'INPUT',
    'FOCUS' = 'FOCUS',
    'BLUR' = 'BLUR'
}
export enum MouseEventType {
    'MOVE' = 'MOVE',
    'CLICK' = 'click'
}

export interface WindowSnapshot {
    type: SnapshotType.WINDOW
    data: {
        width: number
        height: number
        href: string
    }
    time: string
}

export interface DOMSnapshot {
    type: SnapshotType.DOM
    data: any
    time: string
}
export interface MouseSnapshot {
    type: SnapshotType.MOUSE
    data: {
        type: MouseEventType
        x: number
        y: number
        id?: number
    }
    time: string
}
export interface DOMObserve {
    type: SnapshotType.DOM_UPDATE
    data: {
        mutations: any[]
    }
    time: string
}
export interface FormElementObserve {
    type: SnapshotType.FORM_EL_UPDATE
    data: {
        type: FormElementEvent
        id: number
        value?: string
    }
    time: string
}

export type SnapshotEvent<T> = (e: T) => void
