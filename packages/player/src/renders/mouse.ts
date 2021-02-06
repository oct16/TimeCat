import { MouseEventType, MouseRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils/src'
import { PlayerComponent } from '../components/player'

export function renderMouse(this: PlayerComponent, data: MouseRecordData) {
    const { x, y, id, type } = data

    let left = 0,
        top = 0

    if (id) {
        const node = nodeStore.getNode(id) as HTMLElement
        let rect = {}
        if (node && node.getBoundingClientRect) {
            rect = node.getBoundingClientRect()
        }
        const { left: nodeLeft, top: nodeTop } = rect as any
        left = nodeLeft
        top = nodeTop
    }

    if (type === MouseEventType.MOVE) {
        this.pointer.move(x + left, y + top)
    } else if (type === MouseEventType.CLICK) {
        this.pointer.click(x + left, y + top)
    }
}
