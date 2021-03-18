import { WebGLRecordData } from '@timecat/share'
import { delay, isNumeric, nodeStore } from '@timecat/utils'

type CanvasElementWithContextType = {
    contextType?: 'webgl' | 'experimental-webgl' | '2d'
} & HTMLCanvasElement

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

const GLVars = Object.create(null) as { [key: string]: any[] }

const getWebGLVariable = (value: any) => {
    return GLVars[value] || (GLVars[value] = [])
}

export async function renderWebGL(data: WebGLRecordData) {
    await delay()
    const { id, args } = data
    const canvas = nodeStore.getNode(id) as CanvasElementWithContextType | null
    if (!canvas) {
        return
    }

    if (!canvas.contextType) {
        canvas.contextType = 'webgl'
    } else if (canvas.contextType === '2d') {
        return
    }

    const gl = canvas.getContext('webgl')!
    args.forEach(({ name, args }: { name: keyof WebGLRenderingContext; args: any }) => {
        const command = gl[name]
        if (typeof command === 'function') {
            args = args.map((arg: any) => {
                if (typeof arg === 'string') {
                    if (arg.startsWith('$f32arr')) {
                        const float32Arr = arg.slice(7).split(',')
                        return new Float32Array(float32Arr as any)
                    } else if (arg.startsWith('$arr')) {
                        const arr = new Array(...(arg.slice(4).split(',') as string[]))
                        return arr.map(i => (isNumeric(i) ? +i : i))
                    } else if (arg.startsWith('$')) {
                        const [name, val] = arg.slice(1).split('@')
                        if (name === 'src') {
                            const img = document.createElement('img')
                            img.setAttribute(name, val)
                            return img
                        }
                        const varList = getWebGLVariable(name)
                        return varList[+val]
                    }
                }
                return arg
            })
            const ret = (command as any).call(gl, ...args)
            if (ret?.constructor) {
                const ctorName = ret.constructor.name
                if (WebGLConstructors.some(item => item.name === ctorName)) {
                    const varList = getWebGLVariable(ctorName)
                    if (ret && Array.isArray(varList)) {
                        if (!~varList.indexOf(ret)) {
                            varList.push(ret)
                        }
                    }
                }
            }
        }
    })
}
