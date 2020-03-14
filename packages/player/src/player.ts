import { PointerComponent } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { updateDom } from './dom'
import { reduxStore, PlayerTypes, ProgressState } from '@WebReplay/utils'
import { ProgressComponent } from './progress'

export class PlayerComponent {
    data: SnapshotData[]
    isPause = true
    index = 0
    speed: number
    requestID: number
    startTime: number
    pointer: PointerComponent
    progress: ProgressComponent
    progressState: ProgressState

    progressPercentage = 0
    progressNextTime = 0

    constructor(data: SnapshotData[], pointer: PointerComponent, progress: ProgressComponent) {
        this.data = data
        this.pointer = pointer
        this.progress = progress

        reduxStore.subscribe('player', state => {
            this.progressState = reduxStore.getState()['progress']
            const speed = state.speed
            this.speed = speed

            if (speed > 0) {
                this.play(speed)
            } else {
                this.pause()
            }
        })
    }

    play(speed: number) {
        this.isPause = false

        const { startTime, endTime } = this.progressState
        const duration = endTime - startTime

        const stepTime = duration / 100

        cancelAnimationFrame(this.requestID)
        this.requestID = requestAnimationFrame(loop.bind(this))

        const initTime = Date.now()
        this.startTime = 0

        function loop(this: PlayerComponent) {
            const timeStamp = Date.now() - initTime
            if (this.index > 0 && !this.data[this.index + 1]) {
                this.stop()
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.data[this.index].time)
            }

            const currTime = this.startTime + timeStamp * speed
            const nextTime = Number(this.data[this.index + 1].time)

            if (!this.progressNextTime) {
                this.progressNextTime = currTime
            }

            // for progress
            if (currTime > this.progressNextTime) {
                this.progressNextTime = this.progressNextTime + stepTime
                this.progress.updateProgress(this.progressPercentage)
                this.progressPercentage = this.progressPercentage + 1
            }

            if (currTime >= nextTime) {
                this.execFrame.call(this, this.data[this.index])
                this.index++
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }
    }

    pause() {
        cancelAnimationFrame(this.requestID)
        this.isPause = true

        reduxStore.dispatch({
            type: PlayerTypes.SPEED,
            data: {
                speed: 0
            }
        })
    }

    stop() {
        this.index = 0
        this.progressPercentage = 0
        this.progressNextTime = 0
        this.pause()
    }

    execFrame(this: PlayerComponent, snapshot: SnapshotData) {
        updateDom.call(this, snapshot)
    }
}
