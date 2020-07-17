import { createElement } from '@timecat/virtual-dom'
import { InfoData, SnapshotData, VNode, RecordType } from '@timecat/share'
import { nodeStore, getTime, GS } from '@timecat/utils'
const { getWindow } = GS

function getInitInfo(): InfoData {
    const { name, publicId, systemId } = getWindow().document.doctype || {}
    const doctype = () => ({ name, publicId, systemId } as DocumentType)
    const origin = () => getWindow().location.origin
    const pathname = () => getWindow().location.pathname
    const width = () => window.innerWidth
    const height = () => window.innerHeight
    const scrollTop = () => window.pageYOffset
    const scrollLeft = () => window.pageXOffset

    const getFrameElement = () => getWindow().frameElement
    const frameElement = getFrameElement()
    const frameId = nodeStore.getNodeId(frameElement) || null

    return {
        doctype: doctype(),
        origin: origin(),
        pathname: pathname(),
        scrollTop: scrollTop(),
        scrollLeft: scrollLeft(),
        width: width(),
        height: height(),
        frameId
    }
}

function DOMSnapshot(): SnapshotData {
    return {
        type: RecordType.SNAPSHOT,
        data: {
            vNode: createElement(getWindow().document.documentElement) as VNode,
            ...getInitInfo()
        },
        time: getTime().toString()
    }
}

export const snapshots = {
    DOMSnapshot
}
