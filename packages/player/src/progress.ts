import { secondToDate, delay } from '@TimeCat/utils'
import { ContainerComponent } from './container'

export class ProgressComponent {
    progress: HTMLElement
    currentProgress: HTMLElement
    thumb: HTMLElement
    timer: HTMLElement
    slider: HTMLElement

    constructor(c: ContainerComponent) {
        this.progress = c.container.querySelector('.cat-progress')! as HTMLElement
        this.timer = c.container.querySelector('.cat-timer time') as HTMLElement
        this.thumb = this.progress.querySelector('.cat-thumb') as HTMLElement
        this.currentProgress = this.progress.querySelector('.cat-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.cat-slider-bar') as HTMLElement
    }

    async setProgressAnimation(index: number, total: number, interval: number, speed: number) {
        // progress end
        if (!index && !speed) {
            return
        }

        this.thumb.classList.remove('active')
        this.currentProgress.classList.remove('active')

        await delay(20)

        const currentLeft = (index / total) * 100 + '%'
        this.thumb.style.left = currentLeft
        this.currentProgress.style.width = currentLeft

        // pause
        if (!speed) {
            this.thumb.style.removeProperty('transition-duration')
            this.currentProgress.style.removeProperty('transition-duration')
            return
        }

        const duration = ((total - index) * interval) / speed / 1000 + 's'
        this.thumb.style.transitionDuration = duration
        this.currentProgress.style.transitionDuration = duration

        this.thumb.classList.add('active')
        this.currentProgress.classList.add('active')
    }

    updateTimer(second: number) {
        const t = secondToDate(second)
        if (t) {
            this.timer.innerHTML = t
        }
    }

    resetThumb() {
        this.thumb.classList.remove('active')
        this.currentProgress.classList.remove('active')

        const thumb = this.thumb.cloneNode(true) as HTMLElement
        const currentProgress = this.currentProgress.cloneNode(true) as HTMLElement
        this.thumb.parentNode!.replaceChild(thumb, this.thumb)
        this.currentProgress.parentNode!.replaceChild(currentProgress, this.currentProgress)
        thumb.style.left = '0'
        currentProgress.style.width = '0'
        this.thumb = thumb as HTMLElement
        this.currentProgress = currentProgress as HTMLElement
    }
}
