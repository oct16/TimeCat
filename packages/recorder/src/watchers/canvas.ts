/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

type Prop = keyof CanvasRenderingContext2D

export class CanvasWatcher extends Watcher<CanvasRecord> {
    getCanvasInitState(ctx: CanvasRenderingContext2D) {
        const keys = [
            'direction',
            'dpr',
            'fillStyle',
            'filter',
            'font',
            'globalAlpha',
            'globalCompositeOperation',
            'imageSmoothingEnabled',
            'imageSmoothingQuality',
            'lineCap',
            'lineDashOffset',
            'lineJoin',
            'lineWidth',
            'miterLimit',
            'shadowBlur',
            'shadowColor',
            'shadowOffsetX',
            'shadowOffsetY',
            'strokeStyle',
            'textAlign',
            'textBaseline'
        ] as (keyof CanvasRenderingContext2D)[]

        return Object.values(keys).reduce((obj, key) => {
            return { ...obj, [key]: ctx[key as keyof CanvasRenderingContext2D] }
        }, {} as { [key in keyof CanvasRenderingContext2D]: any })
    }

    init() {
        const canvasElements = document.getElementsByTagName('canvas')
        this.watchCanvas(Array.from(canvasElements))
    }

    watchCanvas(canvasList: Array<HTMLCanvasElement>) {
        const self = this

        const ctxProto = CanvasRenderingContext2D.prototype
        const names = Object.getOwnPropertyNames(ctxProto)

        canvasList
            .map(canvas => {
                const dataURL = canvas.toDataURL()
                this.emitData(RecordType.CANVAS, {
                    id: this.getNodeId(canvas),
                    src: dataURL
                })
                return canvas
            })
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
                    if (name === 'canvas') {
                        return
                    }
                    const val = ctx[name as keyof CanvasRenderingContext2D]
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

    aggregateDataEmitter = this.aggregateManager((id: number, strokes: { name: Prop; args: any[] }[]) => {
        this.emitData(RecordType.CANVAS, {
            id,
            strokes
        })
    }, 30)

    aggregateManager(func: Function, wait: number): any {
        const tasks = Object.create(null) as { [key: number]: { name: Prop; args: any[] }[] }
        const timeouts = Object.create(null) as { [key: number]: number }

        const blockInstances = [CanvasGradient, CanvasPattern]

        return function (this: any, id: number, prop: Prop, args: any) {
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
                tasks[id].push({
                    name: prop,
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
