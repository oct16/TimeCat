/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export abstract class HeatBarBase {
    target: HTMLCanvasElement
    context: CanvasRenderingContext2D
    points: { step: number; snapshot: boolean }[]
    targetWidth: number
    targetHeight: number
    ratio = 2
    constructor(target: HTMLCanvasElement, points: { step: number; snapshot: boolean }[] = []) {
        this.target = target
        this.points = points

        const targetWidth = this.target.offsetWidth * this.ratio
        const targetHeight = this.target.offsetHeight * this.ratio

        this.targetWidth = target.width = targetWidth
        this.targetHeight = target.height = targetHeight

        this.context = target.getContext('2d')!
    }

    abstract draw(): void

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
