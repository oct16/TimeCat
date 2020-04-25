declare module '*.html' {
    const value: string
    export default value
}
declare module '*.css' {
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

interface Window {
    __ReplayStrData__: string
    __ReplayData__: {
        [key: string]: any
        vNode: VNode
        data: SnapshotData[]
        width: number
        height: number
        scrollTop: number
        scrollLeft: number
        doctype: {
            name: string
            publicId: string
            systemId: string
        }
        origin: string
        pathname: string
    }
    wr: {
        record: (
            fn?: ((data: SnapshotData, db: IndexedDBOperator) => void) | undefined
        ) => {
            unsubscribe: () => void
        }
        replay(options: { socketUrl: string } = {} as any): Promise<void>
        exportReplay(opts?: Opts): Promise<void>
    }
}
