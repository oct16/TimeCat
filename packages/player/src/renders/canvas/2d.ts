import { CanvasRecordData, UnionToIntersection } from '@timecat/share'
import { canvasContext2DKeys, nodeStore } from '@timecat/utils'

type CanvasElementWithContextType = {
    contextType?: 'webgl' | 'experimental-webgl' | '2d'
} & HTMLCanvasElement

export function renderCanvas2D(canvasRecordData: CanvasRecordData) {
    const data = canvasRecordData as UnionToIntersection<CanvasRecordData>
    const { src, status, id, strokes } = data
    const canvas = nodeStore.getNode(id) as CanvasElementWithContextType | null
    if (!canvas || canvas.constructor.name !== 'HTMLCanvasElement') {
        return
    }

    if (!canvas.contextType) {
        canvas.contextType = '2d'
    } else if (canvas.contextType === 'webgl' || canvas.contextType === 'experimental-webgl') {
        return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        return
    }

    if (src) {
        const image = new Image()
        image.src = src
        image.onload = function (this: HTMLImageElement) {
            ctx.drawImage(this, 0, 0)
        }
    } else if (status) {
        Object.keys(status).forEach(key => {
            ;(ctx as any)[key] = status[key]
        })
    } else {
        for (const stroke of strokes) {
            const { name: key, args: strokeArgs } = stroke
            const name = typeof key === 'number' ? canvasContext2DKeys[key] : key

            if (!Array.isArray(strokeArgs)) {
                ;(ctx[name] as Object) = strokeArgs
            } else {
                const args = strokeArgs.slice()
                if (name === 'drawImage' || name === 'createPattern') {
                    const nodeId = args[0]
                    args[0] = nodeStore.getNode(nodeId)
                } else if (name === 'putImageData') {
                    const data = args[0].data
                    args[0] = new ImageData(new Uint8ClampedArray(data), args[1], args[2])
                }
                ;(ctx[name] as Function).apply(ctx, args)
            }
        }
    }
}
