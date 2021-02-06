import { WindowRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'
import { PlayerComponent } from '../components/player'

export function renderWindow(this: PlayerComponent, data: WindowRecordData) {
    const { width, height, id } = data
    let target: HTMLElement
    if (id) {
        target = nodeStore.getNode(id) as HTMLElement
        ;(target as HTMLElement).style.width = width + 'px'
        ;(target as HTMLElement).style.height = height + 'px'
    } else {
        target = this.c.sandBoxDoc.body
        this.c.resize({ setWidth: width, setHeight: height })
    }
}
