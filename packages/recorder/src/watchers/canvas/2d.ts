/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { canvasContext2DAttrs, canvasContext2DKeys } from '@timecat/utils'
import { Watcher } from '../../watcher'

type CanvasContext2DKeys = typeof canvasContext2DKeys[number]

export class Canvas2DWatcher extends Watcher<CanvasRecord> {
    getCanvasInitState(ctx: CanvasRenderingContext2D) {
        const keys = canvasContext2DAttrs
        return Object.values(keys).reduce((obj, key) => {
            return { ...obj, [key]: ctx[key as CanvasContext2DKeys] }
        }, {} as { [key in CanvasContext2DKeys]: any })
    }

    protected init() {
        const canvasElements = document.getElementsByTagName('canvas')
        this.watchCanvas(Array.from(canvasElements))
    }

    public watchCanvas(canvasList: Array<HTMLCanvasElement>) {
        const self = this

        const ctxProto = CanvasRenderingContext2D.prototype
        const names = canvasContext2DKeys

        canvasList
            .map(canvas => canvas.getContext('2d'))
            .forEach(ctx => {
                if (!ctx) {
                    return
                }

                this.emitData(RecordType.CANVAS, {
                    id: this.getNodeId(ctx.canvas),
                    status: this.getCanvasInitState(ctx)
                })

                const ctxTemp: { [key: string]: any } = {}
                names.forEach(name => {
                    const original = Object.getOwnPropertyDescriptor(ctxProto, name)!
                    const method = original.value
                    const val = ctx[name as CanvasContext2DKeys]
                    ctxTemp[name] = val

                    const descriptor = Object.getOwnPropertyDescriptor(ctx, name)
                    if (descriptor && (!descriptor.configurable || descriptor.get)) {
                        return
                    }

                    Object.defineProperty(ctx, name, {
                        get() {
                            const context = this
                            const id = self.getNodeId(this.canvas)

                            return typeof method === 'function'
                                ? function () {
                                      const args = [...arguments]
                                      if (name === 'drawImage' || name === 'createPattern') {
                                          args[0] = id
                                      }

                                      self.aggregateDataEmitter(id, name, args)
                                      return method.apply(context, arguments)
                                  }
                                : ctxTemp[name]
                        },
                        set: function (value: any) {
                            const id = self.getNodeId(this.canvas)

                            if (typeof value !== 'function') {
                                self.aggregateDataEmitter(id, name, value)
                            }

                            ctxTemp[name] = value

                            return original.set?.apply(this, arguments)
                        }
                    })

                    this.uninstall(() => {
                        Object.defineProperty(ctxProto, name, original)
                    })
                })
            })
    }

    private aggregateDataEmitter = this.aggregateManager(
        (id: number, strokes: { name: CanvasContext2DKeys; args: any[] }[]) => {
            this.emitData(RecordType.CANVAS, {
                id,
                strokes
            })
        },
        30
    )

    private aggregateManager(func: Function, wait: number) {
        const tasks = Object.create(null) as { [key: number]: { name: CanvasContext2DKeys | number; args: any[] }[] }
        const timeouts = Object.create(null) as { [key: number]: number }

        const blockInstances = [CanvasGradient, CanvasPattern]

        return function (this: any, id: number, name: CanvasContext2DKeys, args: any) {
            const context = this

            function emitData(id: number) {
                const timeout = timeouts[id]
                clearTimeout(timeout)
                timeouts[id] = 0
                const strokes = tasks[id].slice()
                // TODO have problem here
                const clearIndex = strokes.reverse().findIndex(stroke => {
                    if (stroke.name === 'clearRect') {
                        return true
                    }
                })
                const aSliceOfShit = !~clearIndex ? strokes.reverse() : strokes.slice(0, clearIndex + 1).reverse()
                tasks[id].length = 0
                func.call(context, id, aSliceOfShit)
            }

            if (!tasks[id]) {
                tasks[id] = []
            }

            if (!blockInstances.some(instance => args instanceof instance)) {
                const index = canvasContext2DKeys.indexOf(name)
                tasks[id].push({
                    name: index,
                    args
                })
            }

            if (!timeouts[id]) {
                const timeout = window.setTimeout(() => {
                    emitData(id)
                }, wait)
                timeouts[id] = timeout
            }
        }
    }
}
