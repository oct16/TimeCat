import { getOffsetPosition, getTime, throttle, uninstallStore } from '@timecat/utils'
import { WatcherOptions, MouseRecord, RecordType, MouseEventType } from '@timecat/share'
import { Watcher } from './watcher'

export class MouseWatcher extends Watcher<MouseRecord> {
    constructor(options: WatcherOptions<MouseRecord>) {
        super(options)
        this.init()
    }

    init() {
        this.mouseMove()
        this.mouseClick()
    }

    mouseMove() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e, this.context)
            if (offsetPosition) {
                const { x, y, id } = offsetPosition
                this.emitterHook({
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.MOVE,
                        id,
                        x,
                        y
                    },
                    time: getTime().toString()
                })
            }
        }
        const name = 'mousemove'
        const listenerHandle = throttle(evt, 350, {
            trailing: true,
            leading: true
        })

        this.context.document.addEventListener(name, listenerHandle)

        uninstallStore.add(() => {
            this.context.document.removeEventListener(name, listenerHandle)
        })
    }

    mouseClick() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e, this.context)
            if (offsetPosition) {
                const { x, y, id } = offsetPosition
                this.emitterHook({
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.CLICK,
                        id,
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
            this.context.document.removeEventListener(name, listenerHandle)
        })
        this.context.document.addEventListener(name, listenerHandle)
    }
}
