/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export class AnimationFrame {
    requestID: number
    fps: number
    animate: Function
    index = 0
    constructor(animate: Function, fps = 60) {
        this.fps = fps
        this.animate = animate
    }

    public start() {
        let then = performance.now()
        const interval = 1000 / this.fps
        const tolerance = 0.1

        const animateLoop = (now: number) => {
            this.requestID = requestAnimationFrame(animateLoop)
            const delta = now - then

            if (delta >= interval - tolerance) {
                then = now - (delta % interval)
                this.animate(delta, this.index++)
            }
        }
        this.requestID = requestAnimationFrame(animateLoop)
    }

    public stop() {
        cancelAnimationFrame(this.requestID)
    }
}
