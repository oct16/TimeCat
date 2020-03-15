import { ProgressState } from '@WebReplay/utils'

export class ProgressComponent {
    progress: HTMLElement
    thumb: HTMLElement
    slider: HTMLElement
    speed: number
    rafId: number

    progressState: ProgressState

    totalDistance = 0
    constructor(c: HTMLElement) {
        this.progress = c.querySelector('.wr-progress')! as HTMLElement
        this.thumb = this.progress.querySelector('.wr-thumb') as HTMLElement
        this.slider = this.progress.querySelector('.wr-slider-bar') as HTMLElement
    }

    updateProgress(percentage: number) {
        this.thumb.style.left = percentage + '%'
    }
}
