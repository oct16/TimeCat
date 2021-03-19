/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Watcher } from './watcher'
import { SnapshotRecord, RecordType, InfoData, VNode, VSNode, PreFetchRecordData } from '@timecat/share'
import { createElement } from '@timecat/virtual-dom'
import { nodeStore, isVNode, getTime } from '@timecat/utils'
import { rewriteNodes } from './common'

export class Snapshot extends Watcher<SnapshotRecord> {
    protected init() {
        const snapshotData = this.DOMSnapshotData(this.options.context || window)
        const time = getTime()
        this.checkNodesData(snapshotData, time)
        this.emitData(RecordType.SNAPSHOT, snapshotData, time)
    }

    private DOMSnapshotData(context: Window): SnapshotRecord['data'] {
        return {
            vNode: createElement(context.document.documentElement) as VNode,
            ...this.getInitInfo(context)
        }
    }

    private getInitInfo(context: Window): InfoData {
        const { name, publicId, systemId } = context.document.doctype || {}
        const doctype = () => ({ name, publicId, systemId } as DocumentType)
        const href = () => context.location.href
        const width = () => context.innerWidth
        const height = () => context.innerHeight
        const scrollTop = () => context.pageYOffset
        const scrollLeft = () => context.pageXOffset
        const [base] = document.getElementsByTagName('base')

        const getFrameElement = () => context.frameElement
        const frameElement = getFrameElement()
        const frameId = nodeStore.getNodeId(frameElement!) || null
        const baseHref = base?.href

        return {
            doctype: doctype(),
            href: baseHref || href(),
            scrollTop: scrollTop(),
            scrollLeft: scrollLeft(),
            width: width(),
            height: height(),
            frameId
        }
    }

    private checkNodesData({ vNode }: { vNode: VNode }, time: number) {
        const { G_RECORD_OPTIONS: options } = window
        const configs = options?.rewriteResource || []
        if (!configs?.length) {
            return
        }

        const deepLoopChildNodes = (children: (VNode | VSNode)[]) => {
            const vNodes: VNode[] = []
            children.forEach(child => {
                const c = child as VNode
                if (isVNode(c)) {
                    vNodes.push(c, ...deepLoopChildNodes(c.children))
                }
            })
            return vNodes
        }

        rewriteNodes(deepLoopChildNodes(vNode.children), configs, data => {
            this.emitData(RecordType.PATCH, data as PreFetchRecordData, time + 1)
        })
    }
}
