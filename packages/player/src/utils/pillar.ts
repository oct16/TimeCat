export class Pillar {
    target: HTMLCanvasElement
    context: CanvasRenderingContext2D
    points: { step: number; snapshot: boolean }[]
    targetWidth: number
    targetHeight: number
    ratio = 2
    constructor(target: HTMLCanvasElement, points: { step: number; snapshot: boolean }[]) {
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

    draw(points: { step: number; snapshot: boolean }[]) {
        const len = points.length

        const reactWidth = (this.targetWidth / (len * 2)) * this.ratio
        const reactHeight = this.targetHeight * this.ratio

        const max = Math.max.apply(
            null,
            points.map(p => p.step)
        )

        for (let i = 0; i < len; i++) {
            const point = points[i]
            if (!point.step) {
                continue
            }
            const x = i * 2 * reactWidth
            const y = 2
            const w = reactWidth
            const maxHeight = reactHeight * 0.9
            const sinCurve = Math.sin((point.step / max) * (Math.PI / 2))
            const z = 0.16
            const scale = sinCurve * (1 - z) + z
            const h = point.snapshot ? maxHeight : scale * maxHeight
            const color = point.snapshot ? '#6AD1C7' : '#fff'

            this.radiusRect(x, y, w, h, 2, color)
        }
    }

    radiusRect(x: number, y: number, w: number, h: number, r: number, color = '#fff') {
        const min_size = Math.min(w, h)
        if (r > min_size / 2) {
            r = min_size / 2
        }

        this.context.fillStyle = color
        this.context.strokeStyle = color

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
