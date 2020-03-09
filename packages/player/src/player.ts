import { Pointer } from './pointer'
import { SnapshotData, SnapshotType, MouseSnapshotData, MouseEventType } from '@WebReplay/snapshot'

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
            if (!this.startTime) {
                this.startTime = Number(this.data[this.index].time) - timeStamp
            }
            const currTime = this.startTime + timeStamp
            const nextTime = Number(this.data[this.index].time)
            if (currTime >= nextTime) {
                this.execFrame(this.data[this.index])
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

    execFrame(snapshot: SnapshotData) {
        const { type, data } = snapshot
        switch (type) {
            case SnapshotType.MOUSE:
                const { x, y, type } = data as MouseSnapshotData
                if (type === MouseEventType.MOVE) {
                    console.log(x, y)
                    this.pointer.move(x, y)
                } else if (type === MouseEventType.CLICK) {
                    console.log('click', x, y)
                    this.pointer.click(x, y)
                }
                break
            case SnapshotType.DOM_UPDATE:
                break
            case SnapshotType.FORM_EL_UPDATE:
                break
        }
    }
}
