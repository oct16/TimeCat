import { Pointer } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { execFrame } from './dom'
import { Redux } from '@WebReplay/utils'

export class Player {
    data: SnapshotData[]
    isPause = false
    index = 0
    requestID: number
    startTime: number
    pointer: Pointer

    constructor(data: SnapshotData[], pointer: Pointer) {
        this.data = data
        this.pointer = pointer

        Redux.subscribe(state => {
            const speed = state.speed
            if (speed > 0) {
                this.play(speed)
            } else {
                this.pause()
            }
        })
    }

    play(speed: number = 1) {
        function loop(this: Player, timeStamp: DOMHighResTimeStamp) {
            if (!this.data[this.index]) {
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.data[this.index].time) - timeStamp
            }
            const currTime = this.startTime + timeStamp * speed
            const nextTime = Number(this.data[this.index].time)
            if (this.index >= this.data.length - 1) {
                return this.stop()
            } else if (currTime >= nextTime) {
                execFrame.call(this, this.data[this.index])
                this.index++
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }

        this.requestID = requestAnimationFrame(loop.bind(this))
    }

    pause() {
        cancelAnimationFrame(this.requestID)
        this.startTime = 0
        Redux.dispatch({
            type: 'PLAY',
            data: {
                speed: 0
            }
        })
    }

    stop() {
        this.pause()
        this.index = 0
    }

    setSpeed(speed: number) {
        console.log('Set Speed', speed)
    }
}
