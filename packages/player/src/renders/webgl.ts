import { WebGLRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'

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
    const { id, args } = data
    const node = nodeStore.getNode(id)
    if (!node) {
        return
    }

    const canvasElement = node as HTMLCanvasElement
    const gl = canvasElement.getContext('webgl')!
    args.forEach(({ name, args }: { name: keyof WebGLRenderingContext; args: any }) => {
        const command = gl[name]
        if (typeof command === 'function') {
            args = args.map((arg: any) => {
                if (typeof arg === 'string') {
                    if (arg.startsWith('*')) {
                        const floatArr = arg.slice(1).split(',')
                        return new Float32Array(floatArr as any)
                    } else if (arg.startsWith('$')) {
                        const [name, index] = arg.slice(1).split('@')
                        const varList = getWebGLVariable(name) as any[]
                        return varList[+index]
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
