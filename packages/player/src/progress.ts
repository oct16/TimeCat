import { secondToTime, delay, getDateTime } from '@timecat/utils'
import { ContainerComponent } from './container'
import { Heat } from './utils/heat'
import { observer, reduxStore } from './utils'
import { PlayerEventTypes } from './types'

export class ProgressComponent {
    c: ContainerComponent
    progress: HTMLElement
    currentProgress: HTMLElement
    thumb: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    heatBar: HTMLCanvasElement
    heatPoints: number[]

    constructor(c: ContainerComponent) {
        this.c = c
        this.progress = c.container.querySelector('.cat-progress')! as HTMLElement
        this.timer = c.container.querySelector('.cat-timer time') as HTMLElement
        this.thumb = this.progress.querySelector('.cat-thumb') as HTMLElement
        this.currentProgress = this.progress.querySelector('.cat-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.cat-slider-bar') as HTMLElement
        this.heatBar = this.progress.querySelector('.cat-heat-bar') as HTMLCanvasElement
        observer.on(PlayerEventTypes.RESIZE, this.resizeHeatBar.bind(this))
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

        // recalculate progress thumb position
        const percent = index / total
        this.currentProgress.style.width = percent * this.slider.offsetWidth + 'px'
    }

    updateTimer(frameIndex: number, frameInterval: number, curViewDiffTime: number) {
        const c = this.c.options
        const { timeMode } = c
        const seconds = (frameIndex + 1) * frameInterval

        let time
        if (timeMode === 'durationTime') {
            time = secondToTime(seconds / 1000)
        } else {
            const { startTime } = reduxStore.getState('progress')
            const timestamp = startTime + seconds + curViewDiffTime
            time = getDateTime(timestamp)
        }
        if (time) {
            this.timer.innerHTML = time
        }
    }

    resetThumb() {
        this.currentProgress.classList.remove('active')
        const currentProgress = this.currentProgress.cloneNode(true) as HTMLElement
        this.currentProgress.parentNode!.replaceChild(currentProgress, this.currentProgress)
        currentProgress.style.width = '0'
        this.currentProgress = currentProgress as HTMLElement
    }

    drawHeatPoints(points?: number[]) {
        this.heatPoints = points || this.heatPoints
        if (this.heatPoints && this.heatPoints.length) {
            new Heat(this.heatBar, this.heatPoints)
        }
    }

    async resizeHeatBar() {
        // wait for scaling page finish to get target offsetWidth
        await delay(500)
        this.drawHeatPoints()
    }
}
