import { SnapshotData, SnapshotType, WindowSnapshotData, MouseSnapshotData, MouseEventType } from '@WebReplay/snapshot'
import { Container } from './container'
import { DOMSnapshotData } from '../../snapshot/src/types'

class Player {
    data: SnapshotData[]
    isPause = false
    index = 0
    requestID: number
    startTime: number
    constructor(data: SnapshotData[]) {
        this.data = data
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

            requestAnimationFrame(loop.bind(this))
        }

        this.requestID = window.requestAnimationFrame(loop.bind(this))
    }

    pause() {
        cancelAnimationFrame(this.requestID)
    }

    stop() {
        this.pause()
        this.index = 0
    }

    execFrame(snapshot: SnapshotData) {
        const { type, data } = snapshot

        switch (type) {
            case SnapshotType.MOUSE:
                const { x, y, type } = data as MouseSnapshotData
                if (type === MouseEventType.MOVE) {
                    console.log(x, y)
                } else if (type === MouseEventType.CLICK) {
                }

                break
            case SnapshotType.DOM_UPDATE:
                break
            case SnapshotType.FORM_EL_UPDATE:
                break
        }
    }
}

export function replay(data: SnapshotData[]) {
    // const [window, _vNode] = data.splice(0, 2)

    // const { width, height } = window.data as WindowSnapshotData
    // const { vNode } = _vNode.data as DOMSnapshotData

    const [{ width, height }, { vNode }] = data.splice(0, 2).map(_ => _.data) as [WindowSnapshotData, DOMSnapshotData]

    document.documentElement.innerHTML = ''
    new Container({
        vNode,
        width,
        height
    })

    const player = new Player(data)

    player.play()
}
