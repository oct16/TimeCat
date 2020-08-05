import { createFlatVNode } from '@timecat/virtual-dom'
import { getTime, nodeStore, uninstallStore, isVNode, isExistingNode } from '@timecat/utils'
import {
    WatcherOptions,
    RecordEvent,
    RecordType,
    DOMRecord,
    VNode,
    VSNode,
    UpdateNodeData,
    movedNodesData,
    RemoveUpdateData,
    AttributesUpdateData,
    DOMUpdateDataType,
    CharacterDataUpdateData
} from '@timecat/share'
import { Watcher } from './watcher'

export class DOMWatcher extends Watcher<DOMRecord> {
    constructor(options: WatcherOptions<DOMRecord>) {
        super(options)
        this.init()
    }

    init() {
        const Watcher = new MutationObserver(callback => this.mutationCallback(callback, this.emit))

        Watcher.observe(this.context.document.documentElement, {
            attributeOldValue: true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true
        })
        uninstallStore.add(() => Watcher.disconnect())
    }

    mutationCallback(records: MutationRecord[], emit: RecordEvent<DOMRecord>) {
        const addNodesSet: Set<Node> = new Set()
        const removeNodesMap: Map<Node, Node> = new Map()
        const moveNodesSet: Set<Node> = new Set()
        const moveMarkSet: Set<string> = new Set()

        // A node may modify multiple attributes, so use array(not set)
        const attrNodesArray: { key: string; node: Node; oldValue: string | null }[] = []

        const textNodesSet: Set<Node> = new Set()

        function deepAdd(n: Node, target?: Node) {
            const id = nodeStore.getNodeId(n)
            if (id) {
                if (target) {
                    // if exist, go to move and delete in removedSet
                    moveNodesSet.add(n)
                    removeNodesMap.delete(n)

                    const targetId = nodeStore.getNodeId(target)
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

            const id = nodeStore.getNodeId(n)
            const pId = nodeStore.getNodeId(n.parentNode!)

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

        const addedSiblingMap: Map<Node, VNode | VSNode> = new Map()
        addNodesSet.forEach(node => {
            const vn: VNode | VSNode = createFlatVNode(node as Element)
            addedSiblingMap.set(node, vn)
        })

        const addedNodes: UpdateNodeData[] = []
        const addedVNodesMap: Map<number, VNode> = new Map()

        addNodesSet.forEach(node => {
            const parentId = nodeStore.getNodeId(node.parentNode!)!

            const parentVn = addedVNodesMap.get(parentId)

            const isParentSVG = parentVn && parentVn.extra.isSVG

            let vn = addedSiblingMap.get(node)!

            if (isParentSVG && isVNode(vn)) {
                ;(vn as VNode).extra.isSVG = true
            }

            addedNodes.push({
                parentId,
                nextId: nodeStore.getNodeId(node.nextSibling!) || null,
                node: vn
            })

            if (isVNode(vn)) {
                addedVNodesMap.set(vn.id, vn as VNode)
            }
        })

        const movedNodes: movedNodesData[] = []
        moveNodesSet.forEach(node => {
            const nodeId = nodeStore.getNodeId(node)!
            movedNodes.push({
                parentId: nodeStore.getNodeId(node.parentNode!)!,
                nextId: nodeStore.getNodeId(node.nextSibling!) || null,
                id: nodeId
            })
        })

        const removedNodes: RemoveUpdateData[] = []
        removeNodesMap.forEach((parent, node) => {
            const id = nodeStore.getNodeId(node)!
            const parentId = nodeStore.getNodeId(parent)!

            if (parentId) {
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
                    const id = nodeStore.getNodeId(node)
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
                        id: nodeStore.getNodeId(textNode),
                        parentId: nodeStore.getNodeId(textNode.parentNode as Element),
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
        } as DOMUpdateDataType

        if (Object.values(data).some(item => item.length)) {
            this.emitterHook({
                type: RecordType.DOM,
                data,
                time: getTime().toString()
            })
        }
    }
}
