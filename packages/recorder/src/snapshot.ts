import { Watcher } from './watcher'
import { SnapshotRecord, WatcherOptions, RecordType, InfoData, VNode } from '@timecat/share'
import { createElement } from '@timecat/virtual-dom'
import { nodeStore } from '@timecat/utils'

export class Snapshot extends Watcher<SnapshotRecord> {
    constructor(options: WatcherOptions<SnapshotRecord>) {
        super(options)
        this.init()
    }

    init() {
        const snapshotData = this.DOMSnapshotData(this.options.context || window)
        this.emitData(RecordType.SNAPSHOT, snapshotData)
    }

    DOMSnapshotData(context: Window): SnapshotRecord['data'] {
        return {
            vNode: createElement(context.document.documentElement) as VNode,
            ...this.getInitInfo(context)
        }
    }

    getInitInfo(context: Window): InfoData {
        const { name, publicId, systemId } = context.document.doctype || {}
        const doctype = () => ({ name, publicId, systemId } as DocumentType)
        const href = () => context.location.href
        const width = () => context.innerWidth
        const height = () => context.innerHeight
        const scrollTop = () => context.pageYOffset
        const scrollLeft = () => context.pageXOffset

        const getFrameElement = () => context.frameElement
        const frameElement = getFrameElement()
        const frameId = nodeStore.getNodeId(frameElement) || null

        return {
            doctype: doctype(),
            href: href(),
            scrollTop: scrollTop(),
            scrollLeft: scrollLeft(),
            width: width(),
            height: height(),
            frameId
        }
    }
}
