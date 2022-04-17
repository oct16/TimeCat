/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { canvasContext2DAttrs, canvasContext2DKeys, nodeStore } from '@timecat/utils'
import { proxyCreateCanvasElement, removeProxies } from '../../proxy'
import { Watcher } from '../../watcher'
import { detectCanvasContextType, isCanvasBlank } from './utils'

type CanvasContext2DKeys = typeof canvasContext2DKeys[number]

const ProxiedCanvasCache = new WeakMap()

export class Canvas2DWatcher extends Watcher<CanvasRecord> {
    getCanvasInitState(ctx: CanvasRenderingContext2D) {
        const keys = canvasContext2DAttrs
        return Object.values(keys).reduce((obj, key) => {
            return { ...obj, [key]: ctx[key as CanvasContext2DKeys] }
        }, {} as { [key in CanvasContext2DKeys]: any })
    }

    protected init() {
        this.watchCreatedCanvas()
        this.watchCreatingCanvas()
    }

    private watchCreatedCanvas() {
        const canvasElements = document.getElementsByTagName('canvas')
        Array.from(canvasElements).forEach(canvas => {
            if (isCanvasBlank(canvas)) {
                detectCanvasContextType(canvas, contextId => {
                    if (contextId === '2d') {
                        this.watchCanvas(canvas)
                    }
                })
            } else {
                this.watchCanvas(canvas)
            }
        })
    }

    private watchCreatingCanvas() {
        const callback = (canvas: HTMLCanvasElement) => {
            detectCanvasContextType(canvas, contextId => {
                if (contextId === '2d') {
                    this.watchCanvas(canvas)
                }
            })
        }
        proxyCreateCanvasElement.call(this, callback)
        this.uninstall(() => removeProxies())
    }

    public watchCanvas(canvasElement: HTMLCanvasElement) {
        const self = this

        const ctxProto = CanvasRenderingContext2D.prototype
        const names = canvasContext2DKeys

        const ctx = canvasElement.getContext('2d')

        if (!ctx) {
            return
        }

        if (ProxiedCanvasCache.get(canvasElement)) {
            return
        }

        this.emitData(RecordType.CANVAS, {
            id: this.getNodeId(ctx.canvas),
            status: this.getCanvasInitState(ctx)
        })

        const ctxTemp: { [key: string]: any } = {}
        names.forEach(name => {
            const original = Object.getOwnPropertyDescriptor(ctxProto, name)
            if (!original) {
                return
            }
            const method = original.value
            const val = ctx[name as CanvasContext2DKeys]
            ctxTemp[name] = val

            const descriptor = Object.getOwnPropertyDescriptor(ctx, name)

            Object.defineProperty(ctx, name, {
                get() {
                    const context = this
                    const id = self.getNodeId(this.canvas)

                    return typeof method === 'function'
                        ? function () {
                              const args = [...arguments]
                              if (name === 'createPattern') {
                                  args[0] = id
                              } else if (name === 'drawImage') {
                                  const elType = args[0]?.constructor.name
                                  if (elType === 'HTMLCanvasElement') {
                                      const dataUrl = (args[0] as HTMLCanvasElement).toDataURL()
                                      args[0] = dataUrl
                                  } else if (elType === 'HTMLImageElement') {
                                      const img = args[0] as HTMLImageElement
                                      img.setAttribute('crossorigin', 'anonymous')
                                      const imgCanvas = (document.createElement as any)('canvas', false)
                                      imgCanvas.width = img.width
                                      imgCanvas.height = img.height
                                      const ctx = imgCanvas.getContext('2d')!
                                      ctx.drawImage(img, 0, 0, img.width, img.height)
                                      args[0] = imgCanvas.toDataURL()
                                  }
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
                },
                configurable: true
            })

            this.uninstall(() => {
                Object.defineProperty(ctx, name, descriptor || original)
            })
        })

        ProxiedCanvasCache.set(canvasElement, true)
        this.uninstall(() => {
            ProxiedCanvasCache.set(canvasElement, false)
        })
    }

    private aggregateDataEmitter = this.strokesManager(
        (id: number, strokes: { name: CanvasContext2DKeys; args: any[] }[]) => {
            this.emitData(RecordType.CANVAS, {
                id,
                strokes
            })
        }
    )

    private strokesManager(func: Function, wait = 30) {
        const tasks = Object.create(null) as { [key: number]: { name: CanvasContext2DKeys | number; args: any[] }[] }
        const timeouts = Object.create(null) as { [key: number]: number }

        const blockInstances = [CanvasGradient, CanvasPattern]
        return function (this: any, id: number, name: CanvasContext2DKeys, args: any) {
            if (!id) {
                return
            }
            const canvas = nodeStore.getNode(id) as HTMLCanvasElement | null
            if (!canvas) {
                return
            }

            const context = this
            const clearRectIndex = canvasContext2DKeys.indexOf('clearRect')

            const emitStrokes = (id: number) => {
                const timeout = timeouts[id]
                clearTimeout(timeout)
                timeouts[id] = 0
                const strokes = tasks[id].slice()

                // Ignore duplicate rendering
                const { width: canvasWidth, height: canvasHeight } = canvas.getBoundingClientRect()
                const clearIndex = strokes.reverse().findIndex(stroke => {
                    if (stroke.name === clearRectIndex) {
                        const args = stroke.args
                        if (args[0] === 0 && args[1] === 0 && args[2] === canvasWidth && args[3] === canvasHeight) {
                            return true
                        }
                    }
                })
                const latestStrokes = !~clearIndex ? strokes.reverse() : strokes.slice(0, clearIndex + 1).reverse()

                func.call(context, id, latestStrokes)
                tasks[id].length = 0
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
                    emitStrokes(id)
                }, wait)
                timeouts[id] = timeout
            }
        }
    }
}
