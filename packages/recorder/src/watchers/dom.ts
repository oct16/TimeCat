/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createFlatVNode, getVNode } from '@timecat/virtual-dom'
import { isVNode, isExistingNode, nodeStore, getTime } from '@timecat/utils'
import {
    RecordType,
    DOMRecord,
    VNode,
    VSNode,
    UpdateNodeData,
    movedNodesData,
    RemoveUpdateData,
    AttributesUpdateData,
    DOMRecordData,
    CharacterDataUpdateData
} from '@timecat/share'
import { Watcher } from '../watcher'
import { rewriteNodes } from '../common'
import { Recorder } from '../recorder'

export class DOMWatcher extends Watcher<DOMRecord> {
    protected init() {
        const Watcher = new MutationObserver(callback => this.mutationCallback(callback))
        Watcher.observe(this.context.document.documentElement, {
            attributeOldValue: true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true
        })
        this.uninstall(() => Watcher.disconnect())
    }

    private mutationCallback(records: MutationRecord[]) {
        const addNodesSet: Set<Node> = new Set()
        const removeNodesMap: Map<Node, Node> = new Map()
        const moveNodesSet: Set<Node> = new Set()
        const moveMarkSet: Set<string> = new Set()

        // A node may modify multiple attributes, so use array(not set)
        const attrNodesArray: { key: string; node: Node; oldValue: string | null }[] = []

        const textNodesSet: Set<Node> = new Set()
        const context = this
        function deepAdd(n: Node, target?: Node) {
            const id = context.getNodeId(n)
            if (id) {
                if (target) {
                    // if exist, go to move and delete in removedSet
                    moveNodesSet.add(n)
                    removeNodesMap.delete(n)

                    const targetId = context.getNodeId(target)
                    if (targetId) {
                        // mark as entry
                        moveMarkSet.add(targetId + '@' + id)
                    }
                }
            } else {
                addNodesSet.add(n)
            }
            n.childNodes.forEach(cn => deepAdd(cn))
        }

        function deepDeleteInSet(set: Set<Node>, n: Node) {
            set.delete(n)
            n.childNodes.forEach(cn => {
                deepDeleteInSet(set, cn)
            })
        }

        function rmNode(n: Node, target: Node) {
            if (!n) {
                return
            }

            const id = context.getNodeId(n)
            const pId = context.getNodeId(n.parentNode!)

            // shaking node if it hasn't joined the tree
            if (addNodesSet.has(n)) {
                deepDeleteInSet(addNodesSet, n)
                removeNodesMap.set(n, target)
            } else if (moveNodesSet.has(n) && moveMarkSet.has(pId + '@' + id)) {
                deepDeleteInSet(moveNodesSet, n)
                moveMarkSet.delete(pId + '@' + id)
            } else {
                removeNodesMap.set(n, target)
            }
        }

        records.forEach(record => {
            const { target, addedNodes, removedNodes, type, attributeName, oldValue } = record
            switch (type) {
                case 'attributes':
                    attrNodesArray.push({ key: attributeName!, node: target, oldValue })
                    break
                case 'characterData':
                    textNodesSet.add(target)
                    break
                case 'childList':
                    addedNodes.forEach(n => deepAdd(n, target))
                    removedNodes.forEach(n => rmNode(n, target))
                    break
                default:
                    break
            }
        })

        const addedNodes: UpdateNodeData[] = []
        const addedVNodesMap: Map<number, VNode> = new Map()

        addNodesSet.forEach((node: Element) => {
            const parentId = this.getNodeId(node.parentNode!)
            const id = nodeStore.getNodeId(node)
            const vn: VNode | VSNode = id ? getVNode(node, { id }) : createFlatVNode(node as Element)

            if (isVNode(vn)) {
                const name = node.constructor.name
                if (name.startsWith('SVG')) {
                    ;(vn as VNode).extra.isSVG = true
                }
            }

            addedNodes.push({
                parentId,
                nextId: this.getNodeId(node.nextSibling!) || null,
                node: vn
            })

            if (isVNode(vn)) {
                addedVNodesMap.set(vn.id, vn as VNode)
            }
        })

        const movedNodes: movedNodesData[] = []
        moveNodesSet.forEach(node => {
            const nodeId = this.getNodeId(node)!
            movedNodes.push({
                parentId: this.getNodeId(node.parentNode!)!,
                nextId: this.getNodeId(node.nextSibling!) || null,
                id: nodeId
            })
        })

        const removedNodes: RemoveUpdateData[] = []
        removeNodesMap.forEach((parent, node) => {
            const id = this.getNodeId(node)
            const parentId = this.getNodeId(parent)

            if (id && parentId) {
                removedNodes.push({
                    parentId,
                    id
                })
            }
        })

        const attrs: AttributesUpdateData[] = attrNodesArray
            .map(data => {
                const { node, key, oldValue } = data
                if (isExistingNode(node as Element)) {
                    const value = (node as Element).getAttribute(key)
                    if (oldValue === value) {
                        return null
                    }
                    const id = this.getNodeId(node)

                    if ((node as Element).tagName === 'IFRAME' && key === 'src') {
                        this.waitAndRecordIFrame(node as HTMLIFrameElement)
                    }

                    return {
                        id,
                        key,
                        value
                    } as AttributesUpdateData
                }
            })
            .filter(Boolean) as AttributesUpdateData[]

        const texts = [...textNodesSet]
            .map(textNode => {
                if (isExistingNode(textNode) && textNode.parentNode) {
                    return {
                        id: this.getNodeId(textNode),
                        parentId: this.getNodeId(textNode.parentNode as Element),
                        value: textNode.textContent
                    } as CharacterDataUpdateData
                }
            })
            .filter(Boolean) as CharacterDataUpdateData[]

        const data = {
            addedNodes,
            movedNodes,
            removedNodes,
            attrs,
            texts
        } as DOMRecordData

        Object.keys(data).forEach((type: keyof DOMRecordData) => {
            if (!data[type]!.length) {
                delete data[type]
            }
        })

        const time = getTime()

        if (data.addedNodes) {
            // this.watchCanvas(addedNodes)
            this.watchIFrames(addedNodes)
            this.rewriteAddedSource(addedNodes, time)
        }

        if (Object.values(data).some(item => item.length)) {
            this.emitData(RecordType.DOM, data, time)
        }
    }

    private waitAndRecordIFrame(iframe: HTMLIFrameElement) {
        const contentWindow = iframe.contentWindow
        ;(iframe as HTMLIFrameElement & { frameRecorder: Recorder })?.frameRecorder?.destroy()
        const onLoadHandle = () => {
            this.recorder.recordIFrame(contentWindow!)
            iframe.removeEventListener('load', onLoadHandle)
        }
        iframe.addEventListener('load', onLoadHandle)
    }

    private findElementsByTag(name: string, updateNodeData: UpdateNodeData[]) {
        const elements = updateNodeData.filter(data => {
            return (data.node as VNode).tag === name
        })
        return elements as UpdateNodeData<VNode>[]
    }

    private watchIFrames(addedNodes: UpdateNodeData<number | VSNode | VNode>[]) {
        const iframeNodes = this.findElementsByTag('iframe', addedNodes)
        if (iframeNodes.length) {
            iframeNodes
                .map(node => nodeStore.getNode(node.node.id) as HTMLFrameElement)
                .filter(Boolean)
                .map(iframeElement => iframeElement.contentWindow)
                .forEach((context: Window) => this.recorder.recordIFrame(context))
        }
    }

    private rewriteAddedSource(addedNodes: UpdateNodeData<number | VSNode | VNode>[], time: number) {
        const { G_RECORD_OPTIONS: options } = window
        const configs = options?.rewriteResource || []
        if (!configs?.length) {
            return
        }

        const vNodes = addedNodes.map(item => item.node).filter(node => isVNode(node as VNode) && node) as VNode[]
        rewriteNodes(vNodes, configs, data => this.emitData(RecordType.PATCH, data, time + 1))
    }
}
