/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { throttle, isExistingNode } from '@timecat/utils'
import { MouseRecord, RecordType, MouseEventType } from '@timecat/share'
import { Watcher } from '../watcher'

export class MouseWatcher extends Watcher<MouseRecord> {
    scrolling: boolean
    latestMove: { x: number; y: number; id?: number } | null

    protected init() {
        this.mouseMove()
        this.mouseClick()
        this.detectScrolling()
    }

    private detectScrolling() {
        let timer: number
        const evt = () => {
            this.scrolling = true
            clearTimeout(timer)
            timer = this.context.setTimeout(() => {
                this.scrolling = false

                if (this.latestMove) {
                    this.sendMoveData(this.latestMove)
                    this.latestMove = null
                }
            }, 500)
        }

        const eventNames = ['mousewheel', 'scroll']
        eventNames.forEach(name => {
            this.context.document.addEventListener(name, evt, true)
            this.uninstall(() => {
                this.context.document.removeEventListener(name, evt, true)
            })
        })
    }

    sendMoveData(position: { x: number; y: number; id?: number }) {
        const { x, y, id } = position
        this.emitData(RecordType.MOUSE, {
            type: MouseEventType.MOVE,
            id,
            x,
            y
        })
    }

    private mouseMove() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = this.getOffsetPosition(e, this.context)
            if (this.scrolling) {
                this.latestMove = offsetPosition as { x: number; y: number; id?: number }
                return
            }

            offsetPosition && this.sendMoveData(offsetPosition)
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

    private mouseClick() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = this.getOffsetPosition(e, this.context)
            if (offsetPosition) {
                this.emitData(RecordType.MOUSE, {
                    type: MouseEventType.CLICK,
                    ...offsetPosition
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

    private getOffsetPosition(event: MouseEvent, context: Window) {
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
                const rect = frameElement.getBoundingClientRect()
                position.y += rect.top
                position.x += rect.left
            }

            return position
        }
        return false
    }
}
