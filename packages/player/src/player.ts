import { Pointer } from './pointer'
import {
    SnapshotData,
    SnapshotType,
    MouseSnapshotData,
    MouseEventType,
    DOMObserveData,
    nodeStore,
    FormElementObserveData
} from '@WebReplay/snapshot'

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
                    this.pointer.move(x, y)
                } else if (type === MouseEventType.CLICK) {
                    this.pointer.click(x, y)
                }
                break
            case SnapshotType.DOM_UPDATE:
                const { mutations } = data as DOMObserveData
                mutations
                    .sort((a, b) => (a.type as any) - (b.type as any))
                    .forEach(mutate => {
                        const parentNode = nodeStore.getNode(mutate.parentId) as HTMLElement
                        const targetNode = nodeStore.getNode(mutate.nodeId) as Element
                        if (mutate.type === 'delete') {
                            parentNode!.removeChild(parentNode.firstChild!)
                        } else if (mutate.type === 'add') {
                            parentNode!.appendChild(targetNode!)
                        }
                    })

                break
            case SnapshotType.FORM_EL_UPDATE:
                const { id, type: formType, value } = data as FormElementObserveData
                const node = nodeStore.getNode(id) as HTMLFormElement
                if (formType === 'INPUT') {
                    node.value = value
                } else if (formType === 'FOCUS') {
                    node.focus()
                } else if (formType === 'BLUR') {
                    node.blur()
                }
                break
        }
    }
}
