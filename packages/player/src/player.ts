import { PointerComponent } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { updateDom } from './dom'
import { reduxStore, PlayerTypes, ProgressState } from '@WebReplay/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'

export class PlayerComponent {
    data: SnapshotData[]
    delayTime = 5000
    speed = 0
    index = 0
    frameIndex = 0
    lastPercentage = 0
    frames: number[]
    requestID: number
    startTime: number
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    progressState: ProgressState

    constructor(data: SnapshotData[], c: ContainerComponent, pointer: PointerComponent, progress: ProgressComponent) {
        this.data = data
        this.c = c
        this.pointer = pointer
        this.progress = progress

        reduxStore.subscribe('player', state => {
            this.progressState = reduxStore.getState()['progress']
            const speed = state.speed
            this.speed = speed
            if (speed > 0) {
                this.play()
            } else {
                this.pause()
            }
            this.frames = this.getAccuratelyFrame()
        })
    }

    play() {
        if (this.index === 0) {
            this.progress.resetThumb()
            this.c.setViewState()
        }
        cancelAnimationFrame(this.requestID)
        this.requestID = requestAnimationFrame(loop.bind(this))

        const initTime = Date.now()
        this.startTime = 0

        const { endTime } = this.progressState

        function loop(this: PlayerComponent) {
            const timeStamp = Date.now() - initTime
            if (this.frameIndex > 0 && !this.frames[this.frameIndex + 1]) {
                this.stop()
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.frames[this.frameIndex])
            }

            const currTime = this.startTime + timeStamp * this.speed
            const nextTime = Number(this.frames[this.frameIndex + 1])

            if (currTime >= nextTime) {
                this.frameIndex++

                this.progress.updateTimer((endTime - nextTime + this.delayTime) / 1000)
                const progress = (this.frameIndex / this.frames.length) * 100

                if (progress - this.lastPercentage > this.getPercentInterval()) {
                    this.progress.updateProgress(progress)
                    this.lastPercentage = progress
                }

                if (this.data[this.index] && currTime > +this.data[this.index].time) {
                    this.execFrame.call(this, this.data[this.index])
                    this.index++
                }
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }
    }

    pause() {
        cancelAnimationFrame(this.requestID)
        reduxStore.dispatch({
            type: PlayerTypes.SPEED,
            data: {
                speed: 0
            }
        })
    }

    stop() {
        this.speed = 0
        this.index = 0
        this.frameIndex = 0
        this.lastPercentage = 0
        this.pause()
    }

    execFrame(this: PlayerComponent, snapshot: SnapshotData) {
        updateDom.call(this, snapshot)
    }

    getPercentInterval() {
        const k = 0.08
        const b = 0.2
        return this.speed * k + b
    }

    getAccuratelyFrame(interval = 100) {
        this.progressState = reduxStore.getState()['progress']
        const { startTime, endTime } = this.progressState

        const s = +startTime
        const e = +endTime + this.delayTime

        const result: number[] = []

        for (let i = s; i < e; i += interval) {
            result.push(i)
        }
        result.push(e)
        return result
    }
}
