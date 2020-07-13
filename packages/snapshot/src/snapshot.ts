import { createElement } from '@timecat/virtual-dom'
import { InfoData, DOMSnapshotData, VNode } from '@timecat/share'

function getInitInfo(): InfoData {
    const { name, publicId, systemId } = window.document.doctype || {}
    const doctype = () => ({ name, publicId, systemId } as DocumentType)
    const origin = () => window.location.origin
    const pathname = () => window.location.pathname
    const width = () => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    const height = () => window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    const scrollTop = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
    const scrollLeft = () => window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft

    return {
        doctype: doctype(),
        origin: origin(),
        pathname: pathname(),
        scrollTop: scrollTop(),
        scrollLeft: scrollLeft(),
        width: width(),
        height: height()
    }
}

function DOMSnapshot(): DOMSnapshotData {
    return {
        vNode: createElement(document.documentElement) as VNode
    }
}

export const snapshots = {
    getInitInfo,
    DOMSnapshot
}
