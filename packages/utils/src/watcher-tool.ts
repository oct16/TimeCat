import { RecordEvent, RecordData } from '@timecat/share'
import { isDev } from './tools/common'
import { debounce, throttle } from './tools/tool'
import { listenerStore } from './store/listener'

export function emitterHook(emit: RecordEvent<RecordData>, data: RecordData) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

export function registerEvent(options: {
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

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            context.removeEventListener(type, listenerHandle, listenerOptions)
        })
    })
}

export function getOffsetPosition(event: MouseEvent, context: Window) {
    const { view, target, x, y } = event

    if (view === context) {
        const doc = (<HTMLElement>target).ownerDocument!

        const position = {
            x,
            y
        }

        const frameElement = doc?.defaultView?.frameElement as HTMLElement
        if (frameElement) {
            position.y += frameElement.offsetTop
            position.x += frameElement.offsetLeft
        }

        return position
    }
    return false
}