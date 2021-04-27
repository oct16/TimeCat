import { ReplayInternalOptions, SnapshotRecord } from '@timecat/share'
import { nodeStore } from '@timecat/utils'
import { setAttribute } from '@timecat/virtual-dom'
import { createIframeDOM, injectIframeContent } from '../utils'

export async function renderSnapshot(data: SnapshotRecord['data'], cssOptions: ReplayInternalOptions['cssOptions']) {
    const snapshotData = data
    const { frameId } = snapshotData

    if (frameId) {
        const iframeNode = nodeStore.getNode(frameId) as HTMLIFrameElement
        if (iframeNode) {
            const src = iframeNode.getAttribute('src')
            if (src) {
                setAttribute(iframeNode, 'disabled-src', src)
                setAttribute(iframeNode, 'src', null)
            }
            const contentDocument = iframeNode.contentDocument!
            createIframeDOM(contentDocument, snapshotData)
            injectIframeContent(contentDocument, snapshotData, cssOptions)
        }
    }
}
