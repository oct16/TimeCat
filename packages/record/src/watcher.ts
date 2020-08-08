import { WatcherOptions, RecordEvent, RecordData } from '@timecat/share'
import { uninstallStore, debounce, throttle, isDev, logger, getRadix64TimeStr, nodeStore } from '@timecat/utils'

export class Watcher<T extends RecordData> {
    context: Window
    emit: RecordEvent<T>
    options: WatcherOptions<T>

    constructor(options: WatcherOptions<T>) {
        const { emit, context } = options
        this.options = options
        this.context = context
        this.emit = emit
    }

    getRadix64TimeStr = getRadix64TimeStr
    getNode = nodeStore.getNode.bind(nodeStore)
    getNodeId = nodeStore.getNodeId.bind(nodeStore)

    uninstall(fn: Function) {
        uninstallStore.add(fn)
    }

    emitterHook(data: T, callback?: (data: T) => T) {
        if (isDev) {
            logger(data)
        }

        if (callback) {
            return this.emit(callback(data))
        }

        this.emit(data)
    }

    registerEvent(options: {
        context: Window
        eventTypes: string[]
        handleFn: (...args: any[]) => void
        listenerOptions: AddEventListenerOptions
        type: 'throttle' | 'debounce'
        optimizeOptions: { [key: string]: boolean }
        waitTime: number
    }) {
        const { context, eventTypes, handleFn, listenerOptions, type, optimizeOptions, waitTime } = options
        let listenerHandle: (...args: any[]) => void
        if (type === 'throttle') {
            listenerHandle = throttle(handleFn, waitTime, optimizeOptions)
        } else {
            listenerHandle = debounce(handleFn, waitTime, optimizeOptions)
        }

        eventTypes
            .map(type => (fn: (e: Event) => void) => {
                context.addEventListener(type, fn, listenerOptions)
            })
            .forEach(handle => handle(listenerHandle))

        this.uninstall(() => {
            eventTypes.forEach(type => {
                context.removeEventListener(type, listenerHandle, listenerOptions)
            })
        })
    }
}
