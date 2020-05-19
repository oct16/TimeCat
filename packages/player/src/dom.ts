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
} from '@TimeCat/record'
import { PlayerComponent } from './player'
import { nodeStore, isElementNode, isExistingNode, delay } from '@TimeCat/utils'
import { setAttribute, VNode, VSNode, createNode, createSpecialNode } from '@TimeCat/virtual-dom'

function isVNode(n: VNode | VSNode) {
    return !!(n as any).tag
}

function insertOrMoveNode(data: UpdateNodeData) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    if (parentNode && isElementNode(parentNode)) {
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

export async function updateDom(this: PlayerComponent, Record: RecordData) {
    const { type, data } = Record
    switch (type) {
        case RecordType.SCROLL: {
            const { top, left, id } = data as ScrollWatcherData
            let target = (id as number | null)
                ? (nodeStore.getNode(id) as HTMLElement)
                : this.c.sandBoxDoc.documentElement

            const curTop = target.scrollTop

            // prevent jump too long distance
            const behavior = Math.abs(top - curTop) > window.__ReplayData__.snapshot.height * 3 ? 'auto' : 'smooth'
            target.scrollTo({
                top,
                left,
                behavior
            })

            break
        }
        case RecordType.WINDOW: {
            const { width, height, id } = data as WindowWatcherData
            let target: HTMLElement
            if (id) {
                target = nodeStore.getNode(id) as HTMLElement
                ;(target as HTMLElement).style.width = width + 'px'
                ;(target as HTMLElement).style.height = height + 'px'
            } else {
                target = this.c.sandBoxDoc.body
                this.c.resize(width, height)
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
            // Reduce the delay caused by interactive animation
            await delay(200)
            const { addedNodes, removedNodes, attrs, texts } = data as DOMUpdateDataType
            removedNodes.forEach((data: RemoveUpdateData) => {
                const { parentId, id } = data
                const parentNode = nodeStore.getNode(parentId)
                const node = nodeStore.getNode(id)
                if (node && parentNode && parentNode.contains(node)) {
                    parentNode.removeChild(node as Node)
                }
            })

            const addedList = addedNodes.slice()
            const maxRevertCount = addedList.length
            let revertCount = 0
            while (addedList.length) {
                const addData = addedList.shift()
                if (addData) {
                    const revertSignal = insertOrMoveNode(addData)
                    if (revertSignal === 'revert' && revertCount++ < maxRevertCount) {
                        addedList.push(addData)
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
                    if (isExistingNode(node)) {
                        node.textContent = value
                        return
                    }
                    parentNode.innerText = value
                }
            })
            break
        case RecordType.FORM_EL_UPDATE:
            // Reduce the delay caused by interactive animation
            await delay(200)
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
