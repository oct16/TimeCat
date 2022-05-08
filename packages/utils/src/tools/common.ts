/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { nanoid } from 'nanoid'
import * as diff from 'diff'
import { radix64 } from '../performance/radix64'
import { VNode, VSNode, SnapshotRecord, RecordData, RecordType } from '@timecat/share'

export const isDev = process.env.NODE_ENV === 'development'

export const version = '__VERSION__'

export function logError(e: Error | string): string {
    const msg = (e as Error).message || (e as string)
    console.error(`TimeCat Error: ${msg}`)
    return msg
}

export function logWarn(e: Error | string): string {
    const msg = (e as Error).message || (e as string)
    console.warn(`TimeCat Warning: ${msg}`)
    return msg
}

export function logAdvice(msg: string): string {
    console.log(`%c TimeCat Advice: ${msg}`, 'color:#0f0;')
    return msg
}

export function getTime(): number {
    return Date.now()
}

export function getRadix64TimeStr() {
    return radix64.btoa(getTime())
}

export function getRandomCode() {
    const code = nanoid()
    return code.toUpperCase()
}

export function secondToTime(second: number) {
    if (second <= 0) {
        second = 0
    }
    const [h, m, s] = [Math.floor(second / 3600), Math.floor((second / 60) % 60), Math.floor(second % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}

export function getDateTime(timestamp: number) {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = '0' + date.getMinutes()
    const seconds = '0' + date.getSeconds()
    const formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)
    return formattedTime
}

export function toTimeStamp(timeStr: string) {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
        const [min, sec] = parts
        return (+min * 60 + +sec) * 1000
    }

    const [hour, min, sec] = parts
    return (+hour * 3600 + +min * 60 + +sec) * 1000
}

export function isSnapshot(frame: RecordData) {
    return (frame as SnapshotRecord).type === RecordType.SNAPSHOT && !(frame as SnapshotRecord).data.frameId
}

export async function delay(t = 200): Promise<void> {
    return new Promise(r => {
        setTimeout(() => r(), t)
    })
}
export function isVNode(n: VNode | VSNode) {
    return !!(n as VNode).tag
}

export function getStrDiffPatches(oldStr: string, newStr: string) {
    return getPatches(diff.diffChars(oldStr, newStr))
}

export function revertStrByPatches(str: string, changes: ReturnType<typeof getStrDiffPatches>) {
    changes.forEach((change: any) => {
        const { type, value, len } = change
        switch (type) {
            case 'add':
                str = str.substring(0, change.index) + value + str.substring(change.index)
                break
            case 'rm':
                str = str.substring(0, change.index) + str.substring(change.index + len)
                break
        }
    })
    return str
}

function getPatches(changes: diff.Change[]) {
    let index = 0
    const patches = changes
        .map(change => {
            const { added: add, removed: rm, value, count } = change
            const len = count || 0
            if (add) {
                const ret = {
                    index,
                    type: 'add',
                    value
                }
                index += len
                return ret
            } else if (rm) {
                const ret = {
                    index,
                    type: 'rm',
                    len
                }
                return ret
            }
            index += len
        })
        .filter(Boolean)

    return patches as Array<{
        index: number
        type: 'add' | 'rm'
        value?: string
        len?: number
    }>
}

export function isNumeric(n: string) {
    return !isNaN(parseFloat(n)) && isFinite(parseFloat(n))
}

export function throttle(func: Function, wait: number, options: { leading?: boolean; trailing?: boolean } = {}): any {
    let context: any
    let args: any
    let result: any
    let timeout: any = null
    let previous = 0

    const later = function () {
        previous = options.leading === false ? 0 : Date.now()
        timeout = null
        result = func.apply(context, args)
        if (!timeout) context = args = null
    }
    return function (this: any) {
        const now = Date.now()
        if (!previous && options.leading === false) previous = now
        const remaining = wait - (now - previous)
        context = this
        args = arguments
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            }
            previous = now
            result = func.apply(context, args)
            if (!timeout) context = args = null
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining)
        }
        return result
    }
}

type Procedure = (...args: any[]) => void

type Options = {
    isImmediate?: boolean

    // not standard
    isTrailing?: boolean
}

export function debounce<F extends Procedure>(
    func: F,
    waitMilliseconds: number,
    options: Options = {
        isImmediate: false,
        isTrailing: false
    }
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        const context = this

        const doLater = function () {
            timeoutId = undefined
            if (!options.isImmediate || options.isTrailing) {
                func.apply(context, args)
            }
        }

        const shouldCallNow = options.isImmediate && timeoutId === undefined

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(doLater, waitMilliseconds)

        if (shouldCallNow) {
            func.apply(context, args)
        }
    }
}

export function createURL(url: string, base?: string) {
    try {
        return new URL(url, base)
    } catch (e) {
        logError(e)
    }
    return { href: url, pathname: url }
}

export function stateDebounce<T extends string | boolean | number>(
    stateHandle: (setState: (state: T) => void) => void,
    delay: ((state: T) => number) | number,
    initState?: T
) {
    let preState = initState
    let timer = 0
    return (cb: (state: T) => void) => {
        stateHandle(delayExec)

        function delayExec(state: T) {
            if (timer) {
                clearTimeout(timer)
            }

            timer = window.setTimeout(
                () => {
                    if (preState === state) {
                        return
                    }
                    cb(state)
                    preState = state
                    clearTimeout(timer)
                    timer = 0
                },
                typeof delay === 'number' ? delay : delay(state)
            )
        }
    }
}

export function logAsciiLogo() {
    /* eslint-disable */
    return console.log(
        `%c
______ _                _____       _   
|_   _(_)              /  __ \\     | |  
  | |  _ _ __ ___   ___| /  \\/ __ _| |_ 
  | | | | '_ \` _ \\ / _ \\ |    / _\` | __|
  | | | | | | | | |  __/ \\__/\\ (_| | |_ 
  \\_/ |_|_| |_| |_|\\___|\\____/\\__,_|\\__|
    `,
        'color: #1475b2;'
    )
}

export function logBadge(opts: { title: string; content: string; titleColor?: string; backgroundColor?: string }) {
    const { title, content, titleColor, backgroundColor } = opts
    const tColor = titleColor || '#606060'
    const bColor = backgroundColor || '#1475b2'

    const args = [
        '%c '.concat(title, ' %c ').concat(content, ' '),
        'padding: 1px; border-radius: 3px 0 0 3px; color: #fff; background: '.concat(tColor, ';'),
        'padding: 1px; border-radius: 0 3px 3px 0; color: #fff; background: '.concat(bColor, ';')
    ]
    console.log.apply(void 0, args)
}

export function logInfo() {
    logAsciiLogo()
    logBadge({ title: 'version', content: version })
    logBadge({ title: 'more info', content: 'github.com/oct16/timecat' })
}

export function removeGlobalVariables() {
    const keys = Object.keys(window)
    const targetKeys = keys.filter(key => {
        if (key) {
            if (key.startsWith('G_RECORD') || key.startsWith('G_REPLAY')) {
                return true
            }
        }
    }) as (keyof Window)[]

    targetKeys.forEach(key => {
        delete window[key]
    })
}

export function isNativeFunction(fn: Function) {
    if (fn.toString().indexOf('[native code]') > -1) {
        return true
    }
    return false
}

export const tempEmptyFn = () => {}
export const tempEmptyPromise = () => Promise.resolve()

export const canvasContext2DAttrs: (keyof CanvasRenderingContext2D)[] = [
    'direction',
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
]

export const canvasContext2DMethods: (keyof CanvasRenderingContext2D)[] = [
    'arc',
    'arcTo',
    'beginPath',
    'bezierCurveTo',
    'clearRect',
    'clip',
    'closePath',
    'createImageData',
    'createLinearGradient',
    'createPattern',
    'createRadialGradient',
    'drawFocusIfNeeded',
    'drawImage',
    'ellipse',
    'fill',
    'fillRect',
    'fillText',
    'getImageData',
    'getLineDash',
    'getTransform',
    'isPointInPath',
    'isPointInStroke',
    'lineTo',
    'measureText',
    'moveTo',
    'putImageData',
    'quadraticCurveTo',
    'rect',
    'resetTransform',
    'restore',
    'rotate',
    'save',
    'scale',
    'setLineDash',
    'setTransform',
    'stroke',
    'strokeRect',
    'strokeText',
    'transform',
    'translate'
]

export const canvasContext2DKeys: (keyof CanvasRenderingContext2D)[] = [
    ...canvasContext2DAttrs,
    ...canvasContext2DMethods
]

export const canvasContextWebGLAttrs: (keyof WebGLRenderingContext)[] = [
    'drawingBufferWidth',
    'drawingBufferHeight',
    'ACTIVE_ATTRIBUTES',
    'ACTIVE_TEXTURE',
    'ACTIVE_UNIFORMS',
    'ALIASED_LINE_WIDTH_RANGE',
    'ALIASED_POINT_SIZE_RANGE',
    'ALPHA',
    'ALPHA_BITS',
    'ALWAYS',
    'ARRAY_BUFFER',
    'ARRAY_BUFFER_BINDING',
    'ATTACHED_SHADERS',
    'BACK',
    'BLEND',
    'BLEND_COLOR',
    'BLEND_DST_ALPHA',
    'BLEND_DST_RGB',
    'BLEND_EQUATION',
    'BLEND_EQUATION_ALPHA',
    'BLEND_EQUATION_RGB',
    'BLEND_SRC_ALPHA',
    'BLEND_SRC_RGB',
    'BLUE_BITS',
    'BOOL',
    'BOOL_VEC2',
    'BOOL_VEC3',
    'BOOL_VEC4',
    'BROWSER_DEFAULT_WEBGL',
    'BUFFER_SIZE',
    'BUFFER_USAGE',
    'BYTE',
    'CCW',
    'CLAMP_TO_EDGE',
    'COLOR_ATTACHMENT0',
    'COLOR_BUFFER_BIT',
    'COLOR_CLEAR_VALUE',
    'COLOR_WRITEMASK',
    'COMPILE_STATUS',
    'COMPRESSED_TEXTURE_FORMATS',
    'CONSTANT_ALPHA',
    'CONSTANT_COLOR',
    'CONTEXT_LOST_WEBGL',
    'CULL_FACE',
    'CULL_FACE_MODE',
    'CURRENT_PROGRAM',
    'CURRENT_VERTEX_ATTRIB',
    'CW',
    'DECR',
    'DECR_WRAP',
    'DELETE_STATUS',
    'DEPTH_ATTACHMENT',
    'DEPTH_BITS',
    'DEPTH_BUFFER_BIT',
    'DEPTH_CLEAR_VALUE',
    'DEPTH_COMPONENT',
    'DEPTH_COMPONENT16',
    'DEPTH_FUNC',
    'DEPTH_RANGE',
    'DEPTH_STENCIL',
    'DEPTH_STENCIL_ATTACHMENT',
    'DEPTH_TEST',
    'DEPTH_WRITEMASK',
    'DITHER',
    'DONT_CARE',
    'DST_ALPHA',
    'DST_COLOR',
    'DYNAMIC_DRAW',
    'ELEMENT_ARRAY_BUFFER',
    'ELEMENT_ARRAY_BUFFER_BINDING',
    'EQUAL',
    'FASTEST',
    'FLOAT',
    'FLOAT_MAT2',
    'FLOAT_MAT3',
    'FLOAT_MAT4',
    'FLOAT_VEC2',
    'FLOAT_VEC3',
    'FLOAT_VEC4',
    'FRAGMENT_SHADER',
    'FRAMEBUFFER',
    'FRAMEBUFFER_ATTACHMENT_OBJECT_NAME',
    'FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE',
    'FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE',
    'FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL',
    'FRAMEBUFFER_BINDING',
    'FRAMEBUFFER_COMPLETE',
    'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
    'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
    'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
    'FRAMEBUFFER_UNSUPPORTED',
    'FRONT',
    'FRONT_AND_BACK',
    'FRONT_FACE',
    'FUNC_ADD',
    'FUNC_REVERSE_SUBTRACT',
    'FUNC_SUBTRACT',
    'GENERATE_MIPMAP_HINT',
    'GEQUAL',
    'GREATER',
    'GREEN_BITS',
    'HIGH_FLOAT',
    'HIGH_INT',
    'IMPLEMENTATION_COLOR_READ_FORMAT',
    'IMPLEMENTATION_COLOR_READ_TYPE',
    'INCR',
    'INCR_WRAP',
    'INT',
    'INT_VEC2',
    'INT_VEC3',
    'INT_VEC4',
    'INVALID_ENUM',
    'INVALID_FRAMEBUFFER_OPERATION',
    'INVALID_OPERATION',
    'INVALID_VALUE',
    'INVERT',
    'KEEP',
    'LEQUAL',
    'LESS',
    'LINEAR',
    'LINEAR_MIPMAP_LINEAR',
    'LINEAR_MIPMAP_NEAREST',
    'LINES',
    'LINE_LOOP',
    'LINE_STRIP',
    'LINE_WIDTH',
    'LINK_STATUS',
    'LOW_FLOAT',
    'LOW_INT',
    'LUMINANCE',
    'LUMINANCE_ALPHA',
    'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
    'MAX_CUBE_MAP_TEXTURE_SIZE',
    'MAX_FRAGMENT_UNIFORM_VECTORS',
    'MAX_RENDERBUFFER_SIZE',
    'MAX_TEXTURE_IMAGE_UNITS',
    'MAX_TEXTURE_SIZE',
    'MAX_VARYING_VECTORS',
    'MAX_VERTEX_ATTRIBS',
    'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
    'MAX_VERTEX_UNIFORM_VECTORS',
    'MAX_VIEWPORT_DIMS',
    'MEDIUM_FLOAT',
    'MEDIUM_INT',
    'MIRRORED_REPEAT',
    'NEAREST',
    'NEAREST_MIPMAP_LINEAR',
    'NEAREST_MIPMAP_NEAREST',
    'NEVER',
    'NICEST',
    'NONE',
    'NOTEQUAL',
    'NO_ERROR',
    'ONE',
    'ONE_MINUS_CONSTANT_ALPHA',
    'ONE_MINUS_CONSTANT_COLOR',
    'ONE_MINUS_DST_ALPHA',
    'ONE_MINUS_DST_COLOR',
    'ONE_MINUS_SRC_ALPHA',
    'ONE_MINUS_SRC_COLOR',
    'OUT_OF_MEMORY',
    'PACK_ALIGNMENT',
    'POINTS',
    'POLYGON_OFFSET_FACTOR',
    'POLYGON_OFFSET_FILL',
    'POLYGON_OFFSET_UNITS',
    'RED_BITS',
    'RENDERBUFFER',
    'RENDERBUFFER_ALPHA_SIZE',
    'RENDERBUFFER_BINDING',
    'RENDERBUFFER_BLUE_SIZE',
    'RENDERBUFFER_DEPTH_SIZE',
    'RENDERBUFFER_GREEN_SIZE',
    'RENDERBUFFER_HEIGHT',
    'RENDERBUFFER_INTERNAL_FORMAT',
    'RENDERBUFFER_RED_SIZE',
    'RENDERBUFFER_STENCIL_SIZE',
    'RENDERBUFFER_WIDTH',
    'RENDERER',
    'REPEAT',
    'REPLACE',
    'RGB',
    'RGB565',
    'RGB5_A1',
    'RGBA',
    'RGBA4',
    'SAMPLER_2D',
    'SAMPLER_CUBE',
    'SAMPLES',
    'SAMPLE_ALPHA_TO_COVERAGE',
    'SAMPLE_BUFFERS',
    'SAMPLE_COVERAGE',
    'SAMPLE_COVERAGE_INVERT',
    'SAMPLE_COVERAGE_VALUE',
    'SCISSOR_BOX',
    'SCISSOR_TEST',
    'SHADER_TYPE',
    'SHADING_LANGUAGE_VERSION',
    'SHORT',
    'SRC_ALPHA',
    'SRC_ALPHA_SATURATE',
    'SRC_COLOR',
    'STATIC_DRAW',
    'STENCIL_ATTACHMENT',
    'STENCIL_BACK_FAIL',
    'STENCIL_BACK_FUNC',
    'STENCIL_BACK_PASS_DEPTH_FAIL',
    'STENCIL_BACK_PASS_DEPTH_PASS',
    'STENCIL_BACK_REF',
    'STENCIL_BACK_VALUE_MASK',
    'STENCIL_BACK_WRITEMASK',
    'STENCIL_BITS',
    'STENCIL_BUFFER_BIT',
    'STENCIL_CLEAR_VALUE',
    'STENCIL_FAIL',
    'STENCIL_FUNC',
    'STENCIL_INDEX8',
    'STENCIL_PASS_DEPTH_FAIL',
    'STENCIL_PASS_DEPTH_PASS',
    'STENCIL_REF',
    'STENCIL_TEST',
    'STENCIL_VALUE_MASK',
    'STENCIL_WRITEMASK',
    'STREAM_DRAW',
    'SUBPIXEL_BITS',
    'TEXTURE',
    'TEXTURE0',
    'TEXTURE1',
    'TEXTURE10',
    'TEXTURE11',
    'TEXTURE12',
    'TEXTURE13',
    'TEXTURE14',
    'TEXTURE15',
    'TEXTURE16',
    'TEXTURE17',
    'TEXTURE18',
    'TEXTURE19',
    'TEXTURE2',
    'TEXTURE20',
    'TEXTURE21',
    'TEXTURE22',
    'TEXTURE23',
    'TEXTURE24',
    'TEXTURE25',
    'TEXTURE26',
    'TEXTURE27',
    'TEXTURE28',
    'TEXTURE29',
    'TEXTURE3',
    'TEXTURE30',
    'TEXTURE31',
    'TEXTURE4',
    'TEXTURE5',
    'TEXTURE6',
    'TEXTURE7',
    'TEXTURE8',
    'TEXTURE9',
    'TEXTURE_2D',
    'TEXTURE_BINDING_2D',
    'TEXTURE_BINDING_CUBE_MAP',
    'TEXTURE_CUBE_MAP',
    'TEXTURE_CUBE_MAP_NEGATIVE_X',
    'TEXTURE_CUBE_MAP_NEGATIVE_Y',
    'TEXTURE_CUBE_MAP_NEGATIVE_Z',
    'TEXTURE_CUBE_MAP_POSITIVE_X',
    'TEXTURE_CUBE_MAP_POSITIVE_Y',
    'TEXTURE_CUBE_MAP_POSITIVE_Z',
    'TEXTURE_MAG_FILTER',
    'TEXTURE_MIN_FILTER',
    'TEXTURE_WRAP_S',
    'TEXTURE_WRAP_T',
    'TRIANGLES',
    'TRIANGLE_FAN',
    'TRIANGLE_STRIP',
    'UNPACK_ALIGNMENT',
    'UNPACK_COLORSPACE_CONVERSION_WEBGL',
    'UNPACK_FLIP_Y_WEBGL',
    'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
    'UNSIGNED_BYTE',
    'UNSIGNED_INT',
    'UNSIGNED_SHORT',
    'UNSIGNED_SHORT_4_4_4_4',
    'UNSIGNED_SHORT_5_5_5_1',
    'UNSIGNED_SHORT_5_6_5',
    'VALIDATE_STATUS',
    'VENDOR',
    'VERSION',
    'VERTEX_ATTRIB_ARRAY_BUFFER_BINDING',
    'VERTEX_ATTRIB_ARRAY_ENABLED',
    'VERTEX_ATTRIB_ARRAY_NORMALIZED',
    'VERTEX_ATTRIB_ARRAY_POINTER',
    'VERTEX_ATTRIB_ARRAY_SIZE',
    'VERTEX_ATTRIB_ARRAY_STRIDE',
    'VERTEX_ATTRIB_ARRAY_TYPE',
    'VERTEX_SHADER',
    'VIEWPORT',
    'ZERO'
]

export const canvasContextWebGLMethods: (keyof WebGLRenderingContext)[] = [
    'activeTexture',
    'attachShader',
    'bindAttribLocation',
    'bindBuffer',
    'bindFramebuffer',
    'bindRenderbuffer',
    'bindTexture',
    'blendColor',
    'blendEquation',
    'blendEquationSeparate',
    'blendFunc',
    'blendFuncSeparate',
    'bufferData',
    'bufferSubData',
    'checkFramebufferStatus',
    'clear',
    'clearColor',
    'clearDepth',
    'clearStencil',
    'colorMask',
    'compileShader',
    'compressedTexImage2D',
    'compressedTexSubImage2D',
    'copyTexImage2D',
    'copyTexSubImage2D',
    'createBuffer',
    'createFramebuffer',
    'createProgram',
    'createRenderbuffer',
    'createShader',
    'createTexture',
    'cullFace',
    'deleteBuffer',
    'deleteFramebuffer',
    'deleteProgram',
    'deleteRenderbuffer',
    'deleteShader',
    'deleteTexture',
    'depthFunc',
    'depthMask',
    'depthRange',
    'detachShader',
    'disable',
    'disableVertexAttribArray',
    'drawArrays',
    'drawElements',
    'enable',
    'enableVertexAttribArray',
    'finish',
    'flush',
    'framebufferRenderbuffer',
    'framebufferTexture2D',
    'frontFace',
    'generateMipmap',
    'getActiveAttrib',
    'getActiveUniform',
    'getAttachedShaders',
    'getAttribLocation',
    'getBufferParameter',
    'getContextAttributes',
    'getError',
    'getExtension',
    'getFramebufferAttachmentParameter',
    'getParameter',
    'getProgramInfoLog',
    'getProgramParameter',
    'getRenderbufferParameter',
    'getShaderInfoLog',
    'getShaderParameter',
    'getShaderPrecisionFormat',
    'getShaderSource',
    'getSupportedExtensions',
    'getTexParameter',
    'getUniform',
    'getUniformLocation',
    'getVertexAttrib',
    'getVertexAttribOffset',
    'hint',
    'isBuffer',
    'isContextLost',
    'isEnabled',
    'isFramebuffer',
    'isProgram',
    'isRenderbuffer',
    'isShader',
    'isTexture',
    'lineWidth',
    'linkProgram',
    'makeXRCompatible' as any,
    'pixelStorei',
    'polygonOffset',
    'readPixels',
    'renderbufferStorage',
    'sampleCoverage',
    'scissor',
    'shaderSource',
    'stencilFunc',
    'stencilFuncSeparate',
    'stencilMask',
    'stencilMaskSeparate',
    'stencilOp',
    'stencilOpSeparate',
    'texImage2D',
    'texParameterf',
    'texParameteri',
    'texSubImage2D',
    'uniform1f',
    'uniform1fv',
    'uniform1i',
    'uniform1iv',
    'uniform2f',
    'uniform2fv',
    'uniform2i',
    'uniform2iv',
    'uniform3f',
    'uniform3fv',
    'uniform3i',
    'uniform3iv',
    'uniform4f',
    'uniform4fv',
    'uniform4i',
    'uniform4iv',
    'uniformMatrix2fv',
    'uniformMatrix3fv',
    'uniformMatrix4fv',
    'useProgram',
    'validateProgram',
    'vertexAttrib1f',
    'vertexAttrib1fv',
    'vertexAttrib2f',
    'vertexAttrib2fv',
    'vertexAttrib3f',
    'vertexAttrib3fv',
    'vertexAttrib4f',
    'vertexAttrib4fv',
    'vertexAttribPointer',
    'viewport'
]

export const canvasContextWebGLKeys: (keyof WebGLRenderingContext)[] = [
    ...canvasContextWebGLAttrs,
    ...canvasContextWebGLMethods
]
