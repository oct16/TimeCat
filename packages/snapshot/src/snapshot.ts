import { createElement } from '@timecat/virtual-dom'
import { InfoData, SnapshotData, VNode, RecordType } from '@timecat/share'
import { nodeStore, getTime } from '@timecat/utils'

function getInitInfo(context: Window): InfoData {
    const { name, publicId, systemId } = context.document.doctype || {}
    const doctype = () => ({ name, publicId, systemId } as DocumentType)
    const origin = () => context.location.origin
    const pathname = () => context.location.pathname
    const width = () => context.innerWidth
    const height = () => context.innerHeight
    const scrollTop = () => context.pageYOffset
    const scrollLeft = () => context.pageXOffset

    const getFrameElement = () => context.frameElement
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

function DOMSnapshot(context: Window): SnapshotData {
    return {
        type: RecordType.SNAPSHOT,
        data: {
            vNode: createElement(context.document.documentElement) as VNode,
            ...getInitInfo(context)
        },
        time: getTime().toString()
    }
}

export const snapshots = {
    DOMSnapshot
}
