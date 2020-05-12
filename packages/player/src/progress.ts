import { throttle, ProgressState, secondToDate } from '@TimeCat/utils'
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

    throttleTimer = throttle(
        (percentage: number) => {
            this.setThumb(percentage)
        },
        250,
        { trailing: true }
    )
    constructor(c: ContainerComponent) {
        this.progress = c.container.querySelector('.cat-progress')! as HTMLElement
        this.timer = c.container.querySelector('.cat-timer') as HTMLElement
        this.thumb = this.progress.querySelector('.cat-thumb') as HTMLElement
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
    }

    resetThumb() {
        const thumb = this.thumb.cloneNode(true) as HTMLElement
        this.thumb.parentNode!.replaceChild(thumb, this.thumb)
        thumb.style.left = '0%'
        this.thumb = thumb as HTMLElement
    }
}
