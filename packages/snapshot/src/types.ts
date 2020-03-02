export enum SnapshotType {
    'WINDOW' = 'WINDOW',
    'DOM' = 'DOM',
    'MOUSE' = 'MOUSE'
}

export interface WindowSnapshot {
    type: SnapshotType.WINDOW
    data: {
        width: number
        height: number
        href: string
    }
}

export interface DOMSnapshot {
    type: SnapshotType.DOM
    data: {
        
    }
}
export interface MouseSnapshot {
    type: SnapshotType.MOUSE
    data: {
        x: number
        y: number
        time: string
    }
}

export type SnapshotEvent<T> = (e: T) => void
