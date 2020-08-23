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
        const listenerHandle = throttle(evt, 300, {
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
                this.emitData({
                    type: RecordType.MOUSE,
                    data: {
                        type: MouseEventType.CLICK,
                        ...offsetPosition
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
        const { mode } = context.G_RECORD_OPTIONS

        const { view, target, x, y, offsetX, offsetY } = event

        if (view === context) {
            const doc = (<HTMLElement>target).ownerDocument!

            function isInline(target: HTMLElement) {
                return context.getComputedStyle(target).display === 'inline'
            }

            // https://stackoverflow.com/questions/8270612/get-element-moz-transformrotate-value-in-jquery
            function getRotate(node: HTMLElement) {
                if (!isExistingNode(node)) {
                    return 0
                }
                const computedStyle = context.getComputedStyle(node)
                const matrix = computedStyle['transform']

                let angle: number
                if (matrix !== 'none') {
                    const values = matrix.split('(')[1].split(')')[0].split(',')
                    const a = Number(values[0])
                    const b = Number(values[1])
                    angle = Math.round(Math.atan2(b, a) * (180 / Math.PI))
                } else {
                    angle = 0
                }
                return angle < 0 ? angle + 360 : angle
            }

            let node = target as HTMLElement
            let id: number | undefined = undefined
            if (isExistingNode(node)) {
                while (isInline(node as HTMLElement)) {
                    node = node.parentElement!
                }
                id = this.getNodeId(node)
            }

            const deg = getRotate(node)
            const position = deg
                ? { x, y } // downgrading
                : {
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
