import { secondToTime, delay, getDateTime } from '@timecat/utils'
import { ContainerComponent } from './container'
import { PlayerEventTypes } from '../types'
import { observer, Heat, Store, Component, IComponent, html } from '../utils'

@Component(
    'player-progress',
    html`<div class="player-progress">
        <div class="player-timer">
            <time>
                00:00
            </time>
        </div>
        <div class="player-slider-bar">
            <div class="player-heat-bar-container">
                <canvas class="player-heat-bar"></canvas>
            </div>
            <div class="player-current-progress">
                <div class="player-thumb"></div>
            </div>
        </div>
    </div>`
)
export class ProgressComponent implements IComponent {
    target: HTMLElement
    parent: HTMLElement
    c: ContainerComponent
    progress: HTMLElement
    currentProgress: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    heatBar: HTMLCanvasElement
    heatPoints: number[]

    constructor(c: ContainerComponent) {
        this.c = c
        this.progress = c.container.querySelector('.player-progress')! as HTMLElement
        this.timer = c.container.querySelector('.player-timer time') as HTMLElement
        this.currentProgress = this.progress.querySelector('.player-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.player-slider-bar') as HTMLElement
        this.heatBar = this.progress.querySelector('.player-heat-bar') as HTMLCanvasElement
        observer.on(PlayerEventTypes.RESIZE, this.resizeHeatBar.bind(this))

        this.listenElementOnHover(this.parent)(isHover => {
            if (isHover) {
                this.getThumb().setAttribute('active', '')
                return
            }
            this.getThumb().removeAttribute('active')
        })

        this.progress.addEventListener('click', e => {
            const { left, width: sliderWidth } = this.slider.getBoundingClientRect()
            const width = Math.max(0, Math.min(e.x - left, sliderWidth))
            const percent = +(width / sliderWidth).toFixed(2)
            const progress = this.findProgressByPosition(percent)
            observer.emit(PlayerEventTypes.JUMP, progress)
        })
    }

    findProgressByPosition = (() => {
        const cacheMap = new Map() as Map<number, { index: number; percent: number; time: number }>
        return function (percent: number) {
            const result = cacheMap.get(percent)
            if (result) {
                return result
            }
            const { startTime, duration, packsInfo } = Store.getState().progress
            const { packs } = Store.getState().replayData
            const time = startTime + duration * percent

            const index = packsInfo.findIndex(pack => {
                const { startTime, endTime, diffTime } = pack
                if (startTime - diffTime <= time && endTime - diffTime >= time) {
                    return true
                }
            })

            if (index !== undefined) {
                const records = packs[index]
                const packInfo = packsInfo[index]
                const diffTime = packInfo.diffTime
                for (let i = 0; i < records.length; i++) {
                    const cur = records[i]
                    const next = records[i + 1]
                    if (next) {
                        if (time >= cur.time - diffTime && time <= next.time - diffTime) {
                            const data = { index, percent, time: cur.time - diffTime }
                            cacheMap.set(percent, data)
                            return data
                        }
                    }
                }
            }
            return null
        }
    })()

    listenElementOnHover = (el: HTMLElement) => {
        let hoverState = false
        const delayTime = 1200
        let timer = 0
        return (cb: (isHover: boolean) => void) => {
            el.addEventListener('mouseover', () => {
                delayExec(true)
            })

            el.addEventListener('mouseout', () => {
                delayExec(false)
            })

            function delayExec(isHover: boolean) {
                const preState = hoverState
                hoverState = isHover
                if (timer || preState === isHover) {
                    return
                }
                timer = window.setTimeout(
                    () => {
                        cb(hoverState)
                        clearTimeout(timer)
                        timer = 0
                    },
                    hoverState ? delayTime / 5 : delayTime
                )
            }
        }
    }

    getThumb() {
        return this.progress.querySelector('.player-thumb') as HTMLElement
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
            const { startTime } = Store.getState().progress
            const timestamp = startTime + seconds + curViewDiffTime
            time = getDateTime(timestamp)
        }
        if (time) {
            this.timer.innerHTML = time
        }
    }

    moveThumb(percent: number) {
        const left = percent * this.slider.offsetWidth
        this.resetThumb(left)
    }

    resetThumb(left = 0) {
        this.currentProgress.classList.remove('active')
        const currentProgress = this.currentProgress.cloneNode(true) as HTMLElement
        this.currentProgress.parentNode!.replaceChild(currentProgress, this.currentProgress)
        currentProgress.style.width = left + 'px'
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
