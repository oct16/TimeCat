import { secondToTime, delay, getDateTime } from '@timecat/utils'
import { ContainerComponent } from './container'
import { PlayerEventTypes } from '../types'
import { observer, Heat, Store, Component, IComponent, html } from '../utils'
import { Pillar } from '../utils/pillar'

@Component(
    'player-progress',
    html`<div class="player-progress">
        <div class="player-timer">00:00</div>
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
    heatPoints: { step: number; snapshot: boolean }[] = []

    constructor(c: ContainerComponent) {
        this.c = c
        this.progress = c.container.querySelector('.player-progress')! as HTMLElement
        this.timer = c.container.querySelector('.player-timer') as HTMLElement
        this.currentProgress = this.progress.querySelector('.player-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.player-slider-bar') as HTMLElement
        this.heatBar = this.progress.querySelector('.player-heat-bar') as HTMLCanvasElement

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
                const { startTime, diffTime } = packInfo
                const totalDurationTime = packsInfo.reduce((acc, info) => acc + info.duration, 0)
                const beforeDurationTime = packsInfo.slice(0, index).reduce((acc, info) => acc + info.duration, 0)
                for (let i = 0; i < records.length; i++) {
                    const cur = records[i]
                    const next = records[i + 1]
                    if (next) {
                        if (time >= cur.time - diffTime && time <= next.time - diffTime) {
                            // revise position between two records
                            const reviseTime = totalDurationTime * percent - (cur.time - startTime) - beforeDurationTime
                            const time = cur.time - diffTime + reviseTime
                            const data = { index, percent, time }
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
        if (!index && !speed) {
            return
        }
        const delayTime = 50
        const percent = index / total
        this.moveThumb(percent)

        this.currentProgress.classList.remove('active')
        this.currentProgress.style.removeProperty('transition')
        await delay(delayTime)

        if (!speed) {
            this.currentProgress.style.setProperty('transition', 'none')
            return
        }

        const remindDuration = ((total - index) * interval) / speed / 1000 - delayTime / 1000 + 's'
        this.currentProgress.style.transitionDuration = remindDuration
        this.currentProgress.classList.add('active')
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

    drawHeatPoints(points?: { step: number; snapshot: boolean }[]) {
        if (points) {
            if (isPointsEqual(this.heatPoints, points)) {
                return
            }
            this.heatPoints = points
        } else if (this.heatPoints.length) {
            return
        }

        if (this.heatPoints.length) {
            new Pillar(this.heatBar, this.heatPoints)
        }

        function isPointsEqual(a: { step: number; snapshot: boolean }[], b: { step: number; snapshot: boolean }[]) {
            if (a.length !== b.length) {
                return false
            }

            for (let i = 0; i < a.length; i++) {
                const itemA = a[i]
                const itemB = b[i]
                if (itemA.step !== itemB.step || itemA.snapshot !== itemB.snapshot) {
                    return false
                }
            }
            return true
        }
    }
}
