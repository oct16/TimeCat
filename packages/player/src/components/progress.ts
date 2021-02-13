/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { secondToTime, getDateTime, stateDebounce } from '@timecat/utils'
import { ContainerComponent } from './container'
import { PlayerEventTypes } from '../types'
import { Pillar, NormalLine, observer, Store, Component, IComponent, html } from '../utils'
import { ReplayInternalOptions } from '@timecat/share'

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
    thumb: HTMLElement
    currentProgress: HTMLElement
    timer: HTMLElement
    slider: HTMLElement
    heatBar: HTMLCanvasElement
    heatPoints: { step: number; snapshot: boolean }[] = []
    options: ReplayInternalOptions

    constructor(options: ReplayInternalOptions, c: ContainerComponent) {
        this.options = options
        this.c = c
        this.progress = c.container.querySelector('.player-progress')! as HTMLElement
        this.progress = c.container.querySelector('.player-progress')! as HTMLElement
        this.timer = c.container.querySelector('.player-timer') as HTMLElement
        this.currentProgress = this.progress.querySelector('.player-current-progress') as HTMLElement
        this.slider = this.progress.querySelector('.player-slider-bar') as HTMLElement
        this.heatBar = this.progress.querySelector('.player-heat-bar') as HTMLCanvasElement
        this.thumb = this.progress.querySelector('.player-thumb') as HTMLElement
        this.listenElementOnHover(this.parent)(state => {
            if (state === 'in') {
                this.thumb.setAttribute('active', '')
                return
            }
            this.thumb.removeAttribute('active')
        })

        const handle = (e: MouseEvent) => {
            const { left, width: sliderWidth } = this.slider.getBoundingClientRect()
            const width = Math.max(0, Math.min(e.x - left, sliderWidth))
            const percent = +(width / sliderWidth).toFixed(3)
            const progress = this.findProgressByPosition(percent)
            observer.emit(PlayerEventTypes.JUMP, progress)
        }
        this.progress.addEventListener('click', handle, false)
        this.options.destroyStore.add(() => {
            this.progress.removeEventListener('click', handle, false)
        })
    }

    private findProgressByPosition = (() => {
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

    private listenElementOnHover = (target: HTMLElement) =>
        stateDebounce<'in' | 'out'>(
            setState => {
                const stateIn = () => setState('in')
                const stateOut = () => setState('out')
                target.addEventListener('mouseover', stateIn, false)
                target.addEventListener('mouseout', stateOut, false)
                this.options.destroyStore.add(() => {
                    target.removeEventListener('mouseover', stateIn, false)
                    target.removeEventListener('mouseout', stateOut, false)
                })
            },
            state => (state === 'in' ? 200 : 1000),
            'out'
        )

    public updateTimer(frameIndex: number, frameInterval: number, curViewDiffTime: number) {
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

    public moveThumb(percent = 0) {
        const left = percent * this.slider.offsetWidth
        this.currentProgress.style.width = left + 'px'
    }

    public drawHeatPoints(points?: { step: number; snapshot: boolean }[]) {
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
        } else {
            new NormalLine(this.heatBar)
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

    public setProgressPosition(percent: number) {
        this.currentProgress.style.width = this.slider.offsetWidth * percent + 'px'
    }
}
