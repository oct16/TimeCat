/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { canvasContextWebGLKeys } from '@timecat/utils'
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
    WebGLUniformLocation,
    WebGLVertexArrayObject
]

export class CanvasWebGLWatcher extends Watcher<CanvasRecord> {
    protected init() {
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

    private GLVars = Object.create(null) as { [key: string]: any }

    public watchCanvas(canvasElement: HTMLCanvasElement) {
        const self = this

        const ctxProto = WebGLRenderingContext.prototype
        const ctx = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl')
        if (!ctx) {
            return
        }
        const ctxTemp: { [key: string]: any } = {}

        for (const key in ctx) {
            const name = key as keyof RenderingContext
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
                    const id = self.getNodeId(this.canvas)

                    return typeof value === 'function'
                        ? function () {
                              const args = [...arguments]
                              self.emitStroke(id, name, args)
                              return value.apply(context, arguments)
                          }
                        : ctxTemp[name]
                },
                set: function (value: any) {
                    const id = self.getNodeId(this.canvas)

                    if (typeof value !== 'function') {
                        this.emitStroke(id, name, value)
                    }

                    ctxTemp[name] = value
                    return original.set?.apply(this, arguments)
                },
                configurable: true
            })

            this.uninstall(() => {
                Object.defineProperty(ctx, name, original)
            })
        }
    }

    parseArgs(argsList: any[]) {
        return argsList.map(({ name, args }) => {
            return {
                name,
                args: args.map((arg: any[]) => {
                    const variable = this.getWebGLVariable(arg)
                    return variable
                })
            }
        })
    }

    // inspired by https://github.com/evanw/webgl-recorder/blob/master/webgl-recorder.js
    private getWebGLVariable(arg: any) {
        if (ArrayBuffer.isView(arg)) {
            return '*' + Array.prototype.slice.call(arg)
        } else if (
            WebGLConstructors.some(ctor => arg instanceof ctor) ||
            (typeof arg === 'object' && arg !== null) ||
            (arg && arg.constructor.name === 'WebGLVertexArrayObjectOES')
        ) {
            const name = arg.constructor.name
            const glVars = this.GLVars[name] || (this.GLVars[name] = [])
            let index = glVars.indexOf(arg)
            if (!~index) {
                index = glVars.length
                glVars.push(arg)
            }

            return '$' + name + '@' + index
        }

        return arg
    }

    emitStroke = strokesManager({
        keys: canvasContextWebGLKeys,
        wait: 20,
        blockInstances: [],
        fn: (id: number, args: { name: keyof typeof canvasContextWebGLKeys; args: any[] }[]) => {
            this.emitData(RecordType.WEBGL, {
                id,
                args: this.parseArgs(args)
            })
        }
    })
}
