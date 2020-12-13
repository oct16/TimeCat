import { HeatBarBase } from './base'

export class Pillar extends HeatBarBase {
    constructor(target: HTMLCanvasElement, points: { step: number; snapshot: boolean }[]) {
        super(target, points)
        this.draw()
    }

    draw(): void {
        const points = this.points
        const len = points.length

        const reactWidth = this.targetWidth / (len * 2)
        const reactHeight = this.targetHeight

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
}
