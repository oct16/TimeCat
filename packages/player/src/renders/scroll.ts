import { ScrollRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'
import { PlayerComponent } from '../components/player'

export function renderScroll(this: PlayerComponent, data: ScrollRecordData) {
    const { top, left, id, behavior: b } = data
    const target = id ? (nodeStore.getNode(id) as HTMLElement) : this.c.sandBoxDoc.documentElement

    if (!target) {
        return
    }

    const curTop = target.scrollTop

    // prevent jump too long distance
    const height = window.G_REPLAY_DATA.snapshot.data.height
    const behavior = b || Math.abs(top - curTop) > height * 3 ? 'auto' : 'smooth'

    const opts = {
        top,
        left,
        behavior
    } as ScrollToOptions

    try {
        target.scroll(opts)
    } catch (error) {
        // fixed for in firefox
        if (target.nodeName === 'HTML') {
            target.ownerDocument.defaultView?.scroll(opts)
        } else {
            target.scrollLeft = left
            target.scrollTop = top
        }
    }
}
