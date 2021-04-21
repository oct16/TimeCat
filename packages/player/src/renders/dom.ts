import {
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMRecordData,
    RemoveUpdateData,
    UpdateNodeData,
    VNode,
    VSNode
} from '@timecat/share'
import { isElementNode, isExistingNode, isVNode, nodeStore } from '@timecat/utils'
import { convertVNode, createSpecialNode, setAttribute } from '@timecat/virtual-dom'

function insertOrMoveNode(data: UpdateNodeData, orderSet: Set<number>) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    const findNextNode = (nextId: number | null): Node | null => {
        return nextId ? nodeStore.getNode(nextId) : null
    }

    if (parentNode && isElementNode(parentNode)) {
        let nextNode: Node | null = null

        if (nextId) {
            // Must wait for the relation node inserted first
            if (orderSet.has(nextId)) {
                return true
            }

            nextNode = findNextNode(nextId)
            if (!nextNode) {
                return true
            }

            if (!parentNode.contains(nextNode)) {
                return true
            }
        }
        const n = node as VNode | VSNode

        let insertNode: Node | null

        if (typeof node === 'number') {
            insertNode = nodeStore.getNode(node)!

            if (orderSet.has(node)) {
                orderSet.delete(node)
            }
        } else if (isVNode(n)) {
            insertNode = convertVNode(n)
        } else {
            insertNode = createSpecialNode(<VSNode>n)
        }

        if (insertNode) {
            parentNode.insertBefore(insertNode, nextNode)
        }
    } else {
        return true
    }
}

export function renderDom(data: DOMRecordData) {
    const { addedNodes, movedNodes, removedNodes, attrs, texts } = data
    removedNodes &&
        removedNodes.forEach((data: RemoveUpdateData) => {
            const { parentId, id } = data
            const parentNode = nodeStore.getNode(parentId)
            const node = nodeStore.getNode(id)
            if (node && parentNode && parentNode.contains(node)) {
                parentNode.removeChild(node as Node)
            }
        })

    const orderSet: Set<number> = new Set()
    const movedList = (movedNodes && movedNodes.slice()) || []

    // node1 -> node2 -> node3
    // insert node2 first
    // insert node1 last
    // => if nextId equal id, insert id first

    movedList.forEach(data => {
        // Is there a relations between two nodes
        if (data.nextId) {
            if (movedList.some(a => a.id === data.nextId)) {
                orderSet.add(data.nextId)
            }
        }
    })

    const addedList = movedList
        .map(item => {
            const { id, parentId, nextId } = item
            return {
                node: id,
                parentId,
                nextId
            } as UpdateNodeData
        })
        .concat((addedNodes && addedNodes.slice()) || [])

    // Math Termial
    if (addedList) {
        const n = addedList.length
        const maxRevertCount = n > 0 ? (n * n + n) / 2 : 0
        let revertCount = 0

        while (addedList.length) {
            const addData = addedList.shift()
            if (addData) {
                if (insertOrMoveNode(addData, orderSet)) {
                    // revert here
                    if (revertCount++ < maxRevertCount) {
                        addedList.push(addData)
                    }
                }
            }
        }
    }

    attrs &&
        attrs.forEach((attr: AttributesUpdateData) => {
            const { id, key, value } = attr
            const node = nodeStore.getNode(id) as HTMLElement

            if (node) {
                setAttribute(node as HTMLElement, key, value)
            }
        })

    texts &&
        texts.forEach((text: CharacterDataUpdateData) => {
            const { id, value, parentId } = text
            const parentNode = nodeStore.getNode(parentId) as HTMLElement
            const node = nodeStore.getNode(id) as HTMLElement

            if (parentNode && node) {
                if (isExistingNode(node)) {
                    node.textContent = value
                    return
                }
                parentNode.innerText = value
            }
        })
}
