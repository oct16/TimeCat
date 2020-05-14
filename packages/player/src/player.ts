import { PointerComponent } from './pointer'
import { updateDom } from './dom'
import { reduxStore, PlayerTypes, ProgressState, getTime } from '@TimeCat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData } from '@TimeCat/record'
import { SnapshotData } from '@TimeCat/snapshot'

export class PlayerComponent {
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    progressState: ProgressState
    data: RecordData[]
    speed = 0
    index = 0
    frameIndex = 0
    lastPercentage = 0
    isFirstTimePlay = true
    frames: number[]
    requestID: number
    startTime: number

    curViewEndTime: number
    curViewDiffTime: number = 0

    constructor(c: ContainerComponent, pointer: PointerComponent, progress: ProgressComponent) {
        this.initViewState()

        this.c = c
        this.pointer = pointer
        this.progress = progress

        if (!this.data.length) {
            // is live mode
            window.addEventListener('record-data', this.streamHandle.bind(this))
        } else {
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
    }

    streamHandle(this: PlayerComponent, e: CustomEvent) {
        const frame = e.detail as RecordData
        if (this.isSnapshot(frame)) {
            window.__ReplayData__.snapshot = frame
            this.c.setViewState()
            return
        }
        this.execFrame(frame)
    }

    isSnapshot(frame: RecordData | SnapshotData) {
        return !!(frame as SnapshotData).vNode
    }

    initViewState() {
        const { __ReplayDataList__: list } = window
        const firstData = list[0]
        this.data = firstData.records

        // live mode
        if (!this.data.length) {
            return
        }

        this.curViewEndTime = +this.data.slice(-1)[0].time
        this.curViewDiffTime = 0
        window.__ReplayData__ = { index: 0, ...firstData }
    }

    switchNextView() {
        const { __ReplayData__: rData, __ReplayDataList__: list } = window

        if (!this.data) {
            return
        }

        const nextIndex = rData.index + 1
        if (nextIndex > list.length - 1) {
            return
        }

        const nextData = list[nextIndex]

        const curEndTime = +this.data.slice(-1)[0].time
        const nextStartTime = +nextData.records[0].time
        this.curViewDiffTime += nextStartTime - curEndTime

        window.__ReplayData__ = { index: nextIndex, ...nextData }
        this.data = nextData.records
        this.curViewEndTime = +this.data.slice(-1)[0].time
        this.index = 0
        this.c.setViewState()
    }

    play() {
        if (this.index === 0) {
            this.progress.resetThumb()
            if (!this.isFirstTimePlay) {
                // Indicates the second times play
                this.initViewState()
                this.c.setViewState()
            }
            this.isFirstTimePlay = false
        }
        cancelAnimationFrame(this.requestID)
        this.requestID = requestAnimationFrame(loop.bind(this))

        const initTime = getTime()
        this.startTime = 0

        function loop(this: PlayerComponent) {
            const timeStamp = getTime() - initTime
            if (this.frameIndex > 0 && !this.frames[this.frameIndex]) {
                this.stop()
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.frames[this.frameIndex])
            }

            const currTime = this.startTime + timeStamp * this.speed
            const nextTime = Number(this.frames[this.frameIndex])

            if (nextTime > this.curViewEndTime) {
                this.switchNextView()
            }

            if (currTime >= nextTime) {
                this.renderEachFrame(currTime)
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }
    }

    renderEachFrame(time: number) {
        const { startTime } = this.progressState
        this.progress.updateTimer((time - startTime) / 1000)
        const progress = (this.frameIndex / (this.frames.length - 1)) * 100
        this.progress.updateProgress(progress)
        let data: RecordData

        while (+(data = this.data[this.index]).time - this.curViewDiffTime <= this.frames[this.frameIndex]) {
            this.execFrame.call(this, data)
            this.index++
            if (this.index === this.data.length) {
                break
            }
        }
        this.frameIndex++
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

    execFrame(this: PlayerComponent, record: RecordData) {
        updateDom.call(this, record)
    }

    getPercentInterval() {
        const k = 0.08
        const b = 0.2
        return this.speed * k + b
    }

    getAccuratelyFrame(interval = 250) {
        this.progressState = reduxStore.getState()['progress']
        const { startTime, endTime } = this.progressState

        const s = +startTime
        const e = +endTime

        const result: number[] = []

        for (let i = s; i < e; i += interval) {
            result.push(i)
        }
        result.push(e)
        return result
    }
}
