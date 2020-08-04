import { RecordEvent, RecordData } from '@timecat/share'
import { isDev, logger } from './common'
import { debounce, throttle } from './tool'
import { uninstallStore } from '../store/listener'
import { nodeStore } from '../store/node'

export function emitterHook<T extends RecordData | SnapshotData>(emit: RecordEvent<T>, data: T) {
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

    uninstallStore.add(() => {
        eventTypes.forEach(type => {
            context.removeEventListener(type, listenerHandle, listenerOptions)
        })
    })
}

export function getOffsetPosition(event: MouseEvent, context: Window) {
    const { mode } = context.__RecordOptions__

    const { view, target, offsetX: x, offsetY: y } = event

    if (view === context) {
        const doc = (<HTMLElement>target).ownerDocument!

        function isInline(target: HTMLElement) {
            return context.getComputedStyle(target).display === 'inline'
        }

        let node = target as HTMLElement

        while (isInline(node as HTMLElement)) {
            node = node.parentElement!
        }

        const position = {
            id: nodeStore.getNodeId(node),
            x: event.offsetX,
            y: event.offsetY
        }

        const frameElement = doc?.defaultView?.frameElement as HTMLElement
        if (frameElement && mode === 'default') {
            position.y += frameElement.offsetTop
            position.x += frameElement.offsetLeft
        }

        return position
    }
    return false
}
