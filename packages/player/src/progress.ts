import { ProgressState, secondToDate } from '@WebReplay/utils'
import { ContainerComponent } from './container'

export class ProgressComponent {
    progress: HTMLElement
    thumb: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    speed: number
    rafId: number

    progressState: ProgressState

    totalDistance = 0
    constructor(c: ContainerComponent) {
        this.progress = c.container.querySelector('.wr-progress')! as HTMLElement
        this.timer = c.container.querySelector('.wr-timer') as HTMLElement
        this.thumb = this.progress.querySelector('.wr-thumb') as HTMLElement
        this.slider = this.progress.querySelector('.wr-slider-bar') as HTMLElement
    }

    updateProgress(percentage: number) {
        this.thumb.style.left = percentage + '%'
    }

    updateTimer(second: number) {
        const t = secondToDate(second)
        if (t) {
            this.timer.innerHTML = t
        }
    }
}
