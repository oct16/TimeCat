import { WatcherOptions, RecordEvent, RecordData, RecordType, ValueOf } from '@timecat/share'
import { debounce, throttle, nodeStore, getTime } from '@timecat/utils'
import { watchers } from './watchers'
import { RecordAudio } from './audio'
import { Snapshot } from './snapshot'
import { RecordOptions } from './recorder'

export abstract class Watcher<T extends RecordData> {
    relatedId: string
    context: Window
    private emit: RecordEvent<RecordData>
    options: WatcherOptions<T, Map<string, InstanceType<ValueOf<typeof watchers>> | RecordAudio | Snapshot>>
    recordOptions: RecordOptions = window.G_RECORD_OPTIONS

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
        this.options.listenStore.add(fn)
    }

    emitData(type: RecordType, record: RecordData['data'], callback?: (data: RecordData) => T) {
        const data = {
            type,
            data: record,
            relatedId: this.relatedId,
            time: getTime()
        } as RecordData

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
