import {
    RecordData,
    MouseRecordData,
    FormElementWatcherData,
    RecordType,
    MouseEventType,
    CharacterDataUpdateData,
    AttributesUpdateData,
    FormElementEvent,
    WindowWatcherData,
    UpdateNodeData,
    RemoveUpdateData,
    DOMUpdateDataType,
    ScrollWatcherData
} from '@WebReplay/record'
import { PlayerComponent } from './player'
import { nodeStore, isElementNode } from '@WebReplay/utils'
import { setAttribute, VNode, VSNode, createNode, createSpecialNode } from '@WebReplay/virtual-dom'

function isVNode(n: VNode | VSNode) {
    return !!(n as any).tag
}

function insertOrMoveNode(data: UpdateNodeData) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    if (parentNode) {
        const nextNode = findNextNode(nextId)
        const n = node as VNode | VSNode

        let refNode: Node
        if (typeof node === 'number') {
            refNode = nodeStore.getNode(node)!
        } else if (isVNode(n)) {
            refNode = createNode(n as VNode)
        } else {
            refNode = createSpecialNode(n as VSNode)
        }

        if (nextNode) {
            if (isChildNode(parentNode, nextNode)) {
                parentNode.insertBefore(refNode, nextNode)
            } else {
                return 'revert'
            }
        } else {
            parentNode.appendChild(refNode)
        }
    }
}

function isChildNode(parentNode: Node, childNode: Node) {
    if (isElementNode(parentNode)) {
        const childNodes = parentNode.childNodes
        return [...childNodes].indexOf(childNode as ChildNode) !== -1
    }
    return false
}

function findNextNode(nextId: number | null): Node | null {
    return nextId ? nodeStore.getNode(nextId) : null
}

export function updateDom(this: PlayerComponent, Record: RecordData) {
    const { type, data } = Record
    switch (type) {
        case RecordType.SCROLL: {
            const { top, left, id } = data as ScrollWatcherData
            let target = (id as number | null) ? (nodeStore.getNode(id) as HTMLElement) : this.c.sandBoxDoc.body
            target.scrollTo(left, top)
            break
        }
        case RecordType.WINDOW: {
            const { width, height, id } = data as WindowWatcherData
            let target = (id as number | null) ? (nodeStore.getNode(id) as HTMLElement) : this.c.sandBoxDoc.body
            if (target) {
                ;(target as HTMLElement).style.width = width + 'px'
                ;(target as HTMLElement).style.height = height + 'px'
            }
            break
        }
        case RecordType.MOUSE:
            const { x, y, type } = data as MouseRecordData
            if (type === MouseEventType.MOVE) {
                this.pointer.move(x, y)
            } else if (type === MouseEventType.CLICK) {
                this.pointer.click(x, y)
            }
            break
        case RecordType.DOM_UPDATE:
            const { addedNodes, removedNodes, attrs, texts } = data as DOMUpdateDataType

            removedNodes.forEach((data: RemoveUpdateData) => {
                const { parentId, id } = data
                const parentNode = nodeStore.getNode(parentId)
                const node = nodeStore.getNode(id)
                if (node && parentNode && parentNode.contains(node)) {
                    parentNode.removeChild(node as Node)
                }
            })

            const maxRevertCount = addedNodes.length
            let revertCount = 0
            while (addedNodes.length) {
                const addData = addedNodes.shift()
                if (addData) {
                    const revertSignal = insertOrMoveNode(addData)
                    if (revertSignal === 'revert' && revertCount++ < maxRevertCount) {
                        addedNodes.push(addData)
                    }
                }
            }

            attrs.forEach((attr: AttributesUpdateData) => {
                const { id, key, value } = attr
                const node = nodeStore.getNode(id) as HTMLElement

                if (node) {
                    setAttribute(node as HTMLElement, key, value)
                }
            })

            texts.forEach((text: CharacterDataUpdateData) => {
                const { id, value, parentId } = text
                const parentNode = nodeStore.getNode(parentId) as HTMLElement
                const node = nodeStore.getNode(id) as HTMLElement

                if (parentNode && node) {
                    if (node) {
                        parentNode.replaceChild(document.createTextNode(value), node)
                    } else {
                        parentNode.innerText = value
                    }
                }
            })

            break
        case RecordType.FORM_EL_UPDATE:
            const { id, key, type: formType, value } = data as FormElementWatcherData
            const node = nodeStore.getNode(id) as HTMLInputElement | undefined

            if (node) {
                if (formType === FormElementEvent.INPUT) {
                    node.value = value!
                } else if (formType === FormElementEvent.FOCUS) {
                    node.focus()
                } else if (formType === FormElementEvent.BLUR) {
                    node.blur()
                } else if (formType === FormElementEvent.PROP) {
                    if (key) {
                        ;(node as any)[key] = value
                    }
                }
            }
            break
    }
}
