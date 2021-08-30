/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { canvasContextWebGLKeys, nodeStore } from '@timecat/utils'
import { proxyCreateCanvasElement, removeProxies } from '../../proxy'
import { Watcher } from '../../watcher'
import { detectCanvasContextType, isCanvasBlank, strokesManager } from './utils'

const WebGLConstructors = [
    WebGLActiveInfo,
    WebGLBuffer,
    WebGLFramebuffer,
    WebGLProgram,
    WebGLRenderbuffer,
    WebGLShader,
    WebGLShaderPrecisionFormat,
    WebGLTexture,
    WebGLUniformLocation
    // WebGLVertexArrayObject
]

export class CanvasWebGLWatcher extends Watcher<CanvasRecord> {
    protected init() {
        // this.watchCreatedCanvas()
        // this.watchCreatingCanvas()

        this.patchWebGLProto(WebGLRenderingContext.prototype)
        if (window.WebGL2RenderingContext !== undefined) {
            this.patchWebGLProto(WebGL2RenderingContext.prototype)
        }
    }

    patchWebGLProto(proto: WebGLRenderingContext | WebGL2RenderingContext) {
        Object.getOwnPropertyNames(proto).forEach(
            (name: keyof (WebGLRenderingContext | WebGL2RenderingContext) | 'constructor') => {
                if (name === 'canvas' || name === 'constructor') {
                    return
                }
                if ((proto as any).__lookupGetter__(name) !== undefined) {
                    return
                }

                if (typeof proto[name] === 'function') {
                    this.patchProtoFunc(proto, name)
                }
            }
        )
    }

    private patchProtoFunc(
        proto: WebGLRenderingContext | WebGL2RenderingContext,
        name: keyof (WebGLRenderingContext | WebGL2RenderingContext)
    ) {
        const original = proto[name] as Function
        const self = this
        if ('isPatch' in original) {
            return
        }

        const patch = function (this: WebGLRenderingContext) {
            const ret = original.apply(this, arguments)
            const args = [...arguments]
            setTimeout(() => {
                const canvas = this.canvas as HTMLCanvasElement
                const id = self.getNodeId(canvas) || nodeStore.addNode(canvas)
                self.emitStroke(id, name, args)
            })
            return ret
        }

        ;(patch as any).isPatch = true
        ;(proto[name] as Function) = patch

        this.uninstall(() => {
            delete (patch as any).isPatch
            ;(proto[name] as Function) = original
        })
    }

    private GLVars = Object.create(null) as { [key: string]: any }

    private watchCreatedCanvas() {
        const canvasElements = document.getElementsByTagName('canvas')
        Array.from(canvasElements).forEach(canvas => {
            if (isCanvasBlank(canvas)) {
                detectCanvasContextType(canvas, contextId => {
                    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
                        this.watchCanvas(canvas)
                    }
                })
            }
        })
    }

    private watchCreatingCanvas() {
        const callback = (canvas: HTMLCanvasElement) => {
            detectCanvasContextType(canvas, contextId => {
                if (contextId === 'webgl' || contextId === 'experimental-webgl') {
                    this.watchCanvas(canvas)
                }
            })
        }
        proxyCreateCanvasElement.call(this, callback)

        this.uninstall(() => removeProxies())
    }

    private watchCanvas(canvasElement: HTMLCanvasElement) {
        const self = this

        const ctxProto = WebGLRenderingContext.prototype
        const ctx = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl')
        if (!ctx) {
            return
        }
        const ctxTemp: { [key: string]: any } = {}

        for (const key in ctx) {
            const name = key as keyof WebGLRenderingContext
            if (name === 'canvas') {
                continue
            }

            if (key === 'drawingBufferHeight' || key === 'drawingBufferWidth') {
                continue
            }

            const original = Object.getOwnPropertyDescriptor(ctxProto, name)!
            const value = original.value
            ctxTemp[name] = value

            const descriptor = Object.getOwnPropertyDescriptor(ctx, name)
            if (descriptor && (!descriptor.configurable || descriptor.get)) {
                return
            }

            Object.defineProperty(ctx, name, {
                get() {
                    const context = this

                    return typeof value === 'function'
                        ? function () {
                              const args = [...arguments]
                              setTimeout(() => {
                                  const id = self.getNodeId(context.canvas) || nodeStore.addNode(canvasElement)
                                  self.emitStroke(id, name, args)
                              })
                              return value.apply(context, arguments)
                          }
                        : ctxTemp[name]
                },
                set: function (value: any) {
                    setTimeout(() => {
                        const id = self.getNodeId(this.canvas) || nodeStore.addNode(canvasElement)
                        if (typeof value !== 'function') {
                            this.emitStroke(id, name, value)
                        }
                    })

                    ctxTemp[name] = value
                    return original.set?.apply(this, arguments)
                },
                configurable: true
            })

            this.uninstall(() => {
                Object.defineProperty(ctx, name, descriptor || original)
            })
        }
    }

    private parseArgs(argsList: any[]) {
        return argsList.map(({ name, args }) => {
            return {
                name,
                args: args.map((arg: any[]) => this.getWebGLVariable(arg))
            }
        })
    }

    // inspired by https://github.com/evanw/webgl-recorder/blob/master/webgl-recorder.js
    private getWebGLVariable(arg: any) {
        if (ArrayBuffer.isView(arg)) {
            return '$f32arr' + Array.prototype.slice.call(arg)
        } else if (arg instanceof Array) {
            return '$arr' + Array.prototype.slice.call(arg)
        } else if (arg instanceof HTMLImageElement) {
            return '$src@' + arg.src
        } else if (
            WebGLConstructors.some(ctor => arg instanceof ctor) ||
            (typeof arg === 'object' && arg !== null) ||
            (arg && arg.constructor.name === 'WebGLVertexArrayObjectOES')
        ) {
            const ctorName = arg.constructor.name
            const glVars = this.GLVars[ctorName] || (this.GLVars[ctorName] = [])
            let index = glVars.indexOf(arg)
            if (!~index) {
                index = glVars.length
                glVars.push(arg)
            }
            return '$' + ctorName + '@' + index
        }
        return arg
    }

    private emitStroke = strokesManager({
        keys: canvasContextWebGLKeys,
        wait: 20,
        blockInstances: [],
        fn: (id: number, args: Array<{ name: keyof typeof canvasContextWebGLKeys; args: any[] }>) => {
            args = this.parseArgs(args)
            this.emitData(RecordType.WEBGL, {
                id,
                args
            })
        }
    })
}
