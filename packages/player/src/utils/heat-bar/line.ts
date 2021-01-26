/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { HeatBarBase } from './base'

export class NormalLine extends HeatBarBase {
    constructor(target: HTMLCanvasElement) {
        super(target)
        this.draw()
    }

    draw() {
        if (!this.targetWidth) {
            return
        }
        const radius = 4
        this.radiusRect(radius, 2 * radius, this.targetWidth - 2 * radius, 8, radius)
    }
}
