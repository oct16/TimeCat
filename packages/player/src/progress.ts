import { throttle, ProgressState, secondToDate } from '@TimeCat/utils'
import { ContainerComponent } from './container'

export class ProgressComponent {
    progress: HTMLElement
    currentProgress: HTMLElement
    thumb: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    speed: number
    rafId: number

    progressState: ProgressState

    totalDistance = 0

    throttleTimer = throttle(
        (percentage: number) => {
            this.setThumb(percentage)
        },
        300,
        { trailing: true }
    )
    constructor(c: ContainerComponent) {
        this.progress = c.container.querySelector('.cat-progress')! as HTMLElement
        this.timer = c.container.querySelector('.cat-timer') as HTMLElement
        this.thumb = this.progress.querySelector('.cat-thumb') as HTMLElement
        this.currentProgress = this.progress.querySelector('.cat-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.cat-slider-bar') as HTMLElement
    }

    updateProgress(percentage: number) {
        this.throttleTimer(percentage)
    }

    updateTimer(second: number) {
        const t = secondToDate(second)
        if (t) {
            this.timer.innerHTML = t
        }
    }

    setThumb(percentage: number) {
        this.thumb.style.left = percentage + '%'
        this.currentProgress.style.width = (percentage / 100) * (this.progress.offsetWidth - 10) + 'px'
    }

    resetThumb() {
        const thumb = this.thumb.cloneNode(true) as HTMLElement
        const currentProgress = this.currentProgress.cloneNode(true) as HTMLElement
        this.thumb.parentNode!.replaceChild(thumb, this.thumb)
        this.currentProgress.parentNode!.replaceChild(currentProgress, this.currentProgress)
        thumb.style.left = '0%'
        currentProgress.style.width = '0px'
        this.thumb = thumb as HTMLElement
        this.currentProgress = currentProgress as HTMLElement
    }
}
