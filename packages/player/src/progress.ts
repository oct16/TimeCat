import { secondToDate, delay } from '@timecat/utils'
import { ContainerComponent } from './container'
import { Heat } from './utils/heat'

export class ProgressComponent {
    progress: HTMLElement
    currentProgress: HTMLElement
    thumb: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    heatBar: HTMLCanvasElement

    constructor(c: ContainerComponent) {
        this.progress = c.container.querySelector('.cat-progress')! as HTMLElement
        this.timer = c.container.querySelector('.cat-timer time') as HTMLElement
        this.thumb = this.progress.querySelector('.cat-thumb') as HTMLElement
        this.currentProgress = this.progress.querySelector('.cat-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.cat-slider-bar') as HTMLElement
        this.heatBar = this.progress.querySelector('.cat-heat-bar') as HTMLCanvasElement
    }

    async setProgressAnimation(index: number, total: number, interval: number, speed: number) {
        // progress end
        if (!index && !speed) {
            return
        }

        // set width 100%
        this.currentProgress.classList.remove('active')

        // fix change class not trigger animate
        await delay(20)

        this.currentProgress.style.removeProperty('transition')

        // pause
        if (!speed) {
            this.currentProgress.style.width = this.currentProgress.offsetWidth + 'px'
            this.currentProgress.style.setProperty('transition', 'none')
            return
        }

        // remind animation seconds
        const duration = ((total - index) * interval) / speed / 1000
        this.currentProgress.style.transitionDuration = duration + 's'

        // animate
        this.currentProgress.classList.add('active')
    }

    updateTimer(second: number) {
        const t = secondToDate(second)
        if (t) {
            this.timer.innerHTML = t
        }
    }

    resetThumb() {
        this.currentProgress.classList.remove('active')
        const currentProgress = this.currentProgress.cloneNode(true) as HTMLElement
        this.currentProgress.parentNode!.replaceChild(currentProgress, this.currentProgress)
        currentProgress.style.width = '0'
        this.currentProgress = currentProgress as HTMLElement
    }

    drawHeatPoints(points: number[]) {
        new Heat(this.heatBar, points)
    }
}
