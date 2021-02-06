import { PreFetchRecordData } from '@timecat/share'
import { delay, nodeStore } from '@timecat/utils'

export async function renderPatch(data: PreFetchRecordData) {
    const { id, key, url, tag, text } = data
    const node = nodeStore.getNode(id)
    if (!node) {
        await delay(1000)
    }
    const n = node as HTMLElement
    if (n && n.getAttribute(key) === url && n.tagName === tag.toUpperCase()) {
        if (tag === 'link') {
            const replaceNode = document.createElement('style')
            replaceNode.setAttribute('type', 'text/css')
            replaceNode.setAttribute('css-url', url)
            replaceNode.innerHTML = text
            n.replaceWith(replaceNode)
        }
    }
}
