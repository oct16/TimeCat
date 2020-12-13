import { HeatBarBase } from './base'

export class NormalLine extends HeatBarBase {
    constructor(target: HTMLCanvasElement) {
        super(target)
        this.draw()
    }

    draw() {
        const radius = 4
        this.radiusRect(radius, 2 * radius, this.targetWidth - 2 * radius, 8, radius)
    }
}
