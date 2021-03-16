import { CanvasSnapshotRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'

type CanvasElementWithContextType = {
    contextType?: 'webgl' | 'experimental-webgl' | '2d'
} & HTMLCanvasElement

export function renderCanvasSnapshot(data: CanvasSnapshotRecordData) {
    const { src, id } = data
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
    }
}
