import { createElement } from '@TimeCat/virtual-dom'
import { InfoData, DOMSnapshotData } from './types'
import { VNode } from '@TimeCat/virtual-dom'

function getInitInfo(): InfoData {
    const { name, publicId, systemId } = window.document.doctype!
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
