import { throttle, isExistingNode } from '@timecat/utils'
import { WatcherOptions, MouseRecord, RecordType, MouseEventType } from '@timecat/share'
import { Watcher } from '../watcher'

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
            const offsetPosition = this.getOffsetPosition(e, this.context)
            if (offsetPosition) {
                const { x, y, id } = offsetPosition
                this.emitData({
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.MOVE,
                        id,
                        x,
                        y
                    },
                    time: this.getRadix64TimeStr()
                })
            }
        }
        const name = 'mousemove'
        const listenerHandle = throttle(evt, 350, {
            trailing: true,
            leading: true
        })

        this.context.document.addEventListener(name, listenerHandle)

        this.uninstall(() => {
            this.context.document.removeEventListener(name, listenerHandle)
        })
    }

    mouseClick() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = this.getOffsetPosition(e, this.context)
            if (offsetPosition) {
                const { x, y, id } = offsetPosition

                this.emitData({
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.CLICK,
                        id,
                        x,
                        y
                    },
                    time: this.getRadix64TimeStr()
                })
            }
        }

        const name = 'click'
        const listenerHandle = throttle(evt, 250)
        this.uninstall(() => {
            this.context.document.removeEventListener(name, listenerHandle)
        })
        this.context.document.addEventListener(name, listenerHandle)
    }

    getOffsetPosition(event: MouseEvent, context: Window) {
        const { mode } = context.__RecordOptions__

        const { view, target, offsetX, offsetY } = event

        if (view === context) {
            const doc = (<HTMLElement>target).ownerDocument!

            function isInline(target: HTMLElement) {
                return context.getComputedStyle(target).display === 'inline'
            }

            let node = target as HTMLElement
            let id: number | undefined = undefined
            if (isExistingNode(node)) {
                while (isInline(node as HTMLElement)) {
                    node = node.parentElement!
                }
                id = this.getNodeId(node)
            }

            const position = {
                id,
                x: offsetX,
                y: offsetY
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
}
