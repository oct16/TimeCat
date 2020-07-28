import { emitterHook, getOffsetPosition, getTime, nodeStore, throttle, uninstallStore } from '@timecat/utils'
import { WatcherOptions, MouseRecord, RecordType, MouseEventType } from '@timecat/share'

export function MouseWatcher(options: WatcherOptions<MouseRecord>) {
    const { emit, context } = options
    function mouseMove() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e, context)
            if (offsetPosition) {
                const { x, y } = offsetPosition
                emitterHook(emit, {
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.MOVE,
                        x,
                        y
                    },
                    time: getTime().toString()
                })
            }
        }
        const name = 'mousemove'
        const listenerHandle = throttle(evt, 350, {
            trailing: true, leading: true
        })

        context.document.addEventListener(name, listenerHandle)

        uninstallStore.add(() => {
            context.document.removeEventListener(name, listenerHandle)
        })
    }

    function mouseClick() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e, context)
            if (offsetPosition) {
                const { x, y } = offsetPosition
                emitterHook(emit, {
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.CLICK,
                        id: nodeStore.getNodeId(e.target as Element),
                        x,
                        y
                    },
                    time: getTime().toString()
                })
            }
        }

        const name = 'click'
        const listenerHandle = throttle(evt, 250)
        uninstallStore.add(() => {
            context.document.removeEventListener(name, listenerHandle)
        })
        context.document.addEventListener(name, listenerHandle)
    }

    mouseMove()
    mouseClick()
}
