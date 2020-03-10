import { Pointer } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { execFrame } from './dom'
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
    }

    play() {
        function loop(this: Player, timeStamp: DOMHighResTimeStamp) {
            if (!this.data[this.index]) {
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.data[this.index].time) - timeStamp
            }
            const currTime = this.startTime + timeStamp
            const nextTime = Number(this.data[this.index].time)
            if (currTime >= nextTime) {
                execFrame.call(this, this.data[this.index])
                this.index++
            } else if (this.index === this.data.length - 1) {
                return this.stop()
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }

        this.requestID = window.requestAnimationFrame(loop.bind(this))
    }

    command(c: string) {
        switch (c) {
            case 'play':
                this.play()
                break
            case 'pause':
                this.pause()
                break
            case 'x1':
                this.setSpeed(1)
                break
            case 'x4':
                this.setSpeed(4)
                break
            case 'x8':
                this.setSpeed(8)
                break
            default:
                break
        }
    }

    pause() {
        cancelAnimationFrame(this.requestID)
    }

    stop() {
        this.pause()
        this.index = 0
    }

    setSpeed(speed: number) {
        console.log('Set Speed', speed)
    }
}
