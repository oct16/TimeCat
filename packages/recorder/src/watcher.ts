import { WatcherOptions, RecordEvent, RecordData, RecordType, BaseRecord } from '@timecat/share'
import { debounce, throttle, isDev, logger, getRadix64TimeStr, nodeStore } from '@timecat/utils'

export abstract class Watcher<T extends RecordData> {
    relatedId: string
    context: Window
    emit: RecordEvent<RecordData>
    options: WatcherOptions<T>

    constructor(options: WatcherOptions<T>) {
        const { emit, context, relatedId } = options
        this.options = options
        this.relatedId = relatedId
        this.context = context
        this.emit = emit
    }

    abstract init(): void

    getNode = (id: number): Node => nodeStore.getNode.call(nodeStore, id)
    getNodeId = (n: Node): number => nodeStore.getNodeId.call(nodeStore, n)

    uninstall(fn: Function) {
        this.options.reverseStore.add(fn)
    }

    emitData(type: RecordType, record: RecordData['data'], callback?: (data: RecordData) => T) {
        const data = {
            type,
            data: record,
            relatedId: this.relatedId,
            time: getRadix64TimeStr()
        } as RecordData

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
