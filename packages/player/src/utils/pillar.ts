export class Pillar {
    target: HTMLCanvasElement
    context: CanvasRenderingContext2D
    points: number[]
    targetWidth: number
    targetHeight: number
    ratio = 2
    constructor(target: HTMLCanvasElement, points: number[]) {
        this.target = target
        this.points = points

        const targetWidth = this.target.offsetWidth
        const targetHeight = this.target.offsetHeight

        target.width = targetWidth * this.ratio
        target.height = targetHeight * this.ratio

        this.targetWidth = targetWidth
        this.targetHeight = targetHeight

        this.context = target.getContext('2d')!

        this.draw(points)
    }

    draw(points: number[]) {
        const len = points.length
        const drawColor = '#fff'
        this.context.fillStyle = drawColor
        this.context.strokeStyle = drawColor

        const reactWidth = (this.targetWidth / (len * 2)) * this.ratio
        const reactHeight = this.targetHeight * this.ratio

        const max = Math.max.apply(null, points)

        for (let i = 0; i < len; i++) {
            if (!points[i]) {
                continue
            }
            const x = i * 2 * reactWidth
            const y = 2
            const w = reactWidth
            const sinCurve = Math.sin((points[i] / max) * (Math.PI / 2))
            const z = 0.16
            const scale = sinCurve * (1 - z) + z
            const h = scale * (reactHeight * 0.9)
            this.radiusRect(x, y, w, h, 2)
        }
    }

    radiusRect(x: number, y: number, w: number, h: number, r: number) {
        const min_size = Math.min(w, h)
        if (r > min_size / 2) {
            r = min_size / 2
        }

        this.context.beginPath()
        this.context.moveTo(x + r, y)
        this.context.arcTo(x + w, y, x + w, y + h, r)
        this.context.arcTo(x + w, y + h, x, y + h, r)
        this.context.arcTo(x, y + h, x, y, r)
        this.context.arcTo(x, y, x + w, y, r)
        this.context.closePath()

        this.context.stroke()
        this.context.fill()
    }
}
