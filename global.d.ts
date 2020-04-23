// Global compile-time constants
declare var __DEV__: boolean
declare var __TEST__: boolean
declare var __BROWSER__: boolean
declare var __BUNDLER__: boolean
declare var __RUNTIME_COMPILE__: boolean
declare var __GLOBAL__: boolean
declare var __NODE_JS__: boolean
declare var __COMMIT__: string
declare var __VERSION__: string

// Feature flags
declare var __FEATURE_OPTIONS__: boolean
declare var __FEATURE_SUSPENSE__: boolean

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
}
