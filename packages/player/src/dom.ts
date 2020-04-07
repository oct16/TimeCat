import {
    SnapshotData,
    MouseSnapshotData,
    FormElementObserveData,
    SnapshotType,
    MouseEventType,
    CharacterDataUpdateData,
    AttributesUpdateData,
    FormElementEvent,
    WindowObserveData,
    AddedUpdateData,
    removedUpdateData,
    DOMUpdateDataType
} from '@WebReplay/snapshot'
import { PlayerComponent } from './player'
import { nodeStore, isCommentStr, swapNode, getPos } from '@WebReplay/utils'
import { convertVNode, setAttribute } from '@WebReplay/virtual-dom'
import { movedUpdateData } from '../../snapshot/src/types'

export function updateDom(this: PlayerComponent, snapshot: SnapshotData) {
    const { type, data } = snapshot
    switch (type) {
        case SnapshotType.WINDOW:
            const { scrollLeft, scrollTop } = data as WindowObserveData
            this.c.sandBoxDoc.documentElement.scrollTo(scrollLeft, scrollTop)
            break
        case SnapshotType.MOUSE:
            const { x, y, type } = data as MouseSnapshotData
            if (type === MouseEventType.MOVE) {
                this.pointer.move(x, y)
            } else if (type === MouseEventType.CLICK) {
                this.pointer.click(x, y)
            }
            break
        case SnapshotType.DOM_UPDATE:
            const { addedList, removedList, removedAllList, movedList, attrs, texts } = data as DOMUpdateDataType

            removedList.forEach((item: removedUpdateData) => {
                const { parentId, id } = item
                const parentNode = nodeStore.getNode(parentId)
                const node = nodeStore.getNode(id)
                if (node && parentNode) {
                    parentNode.removeChild(node as Node)
                }
            })

            removedAllList.forEach(id => {
                const node = nodeStore.getNode(id) as HTMLElement
                if (node) {
                    node.innerHTML = ''
                }
            })

            addedList.forEach((item: AddedUpdateData) => {
                const { parentId, vNode, pos } = item
                const parentNode = nodeStore.getNode(parentId)
                if (parentNode) {
                    let node: Node
                    if (typeof vNode === 'string') {
                        const text = vNode as string
                        if (isCommentStr(vNode)) {
                            node = document.createComment(text.substring(4, text.length - 3))
                        } else {
                            node = document.createTextNode(text)
                        }
                    } else {
                        node = convertVNode(vNode, null) as Node
                    }

                    if (node) {
                        parentNode.insertBefore(node, parentNode.childNodes[pos])
                    }
                }
            })

            movedList.forEach((moved: movedUpdateData) => {
                const { id, parentId, pos } = moved
                if (id && parentId) {
                    const node = nodeStore.getNode(id)!
                    const curPos = getPos(node)

                    if (curPos !== pos) {
                        const parentNode = nodeStore.getNode(parentId)!
                        const shouldSwapNode = parentNode.childNodes[pos]
                        swapNode(node, shouldSwapNode)
                    }
                }
            })

            attrs.forEach((attr: AttributesUpdateData) => {
                const { id, key, value } = attr
                const node = nodeStore.getNode(id) as HTMLElement

                if (node) {
                    setAttribute(node as HTMLElement, key, value)
                }
            })

            texts.forEach((text: CharacterDataUpdateData) => {
                const { pos, value, parentId } = text
                const parentEl = nodeStore.getNode(parentId) as HTMLElement

                if (parentEl) {
                    if (pos !== null) {
                        const target = parentEl.childNodes[pos as number]
                        parentEl.replaceChild(document.createTextNode(value), target)
                    } else {
                        parentEl.innerText = value
                    }
                }
            })

            break
        case SnapshotType.FORM_EL_UPDATE:
            const { id, key, type: formType, value } = data as FormElementObserveData
            const node = nodeStore.getNode(id) as HTMLFormElement
            if (formType === FormElementEvent.INPUT) {
                node.value = value
            } else if (formType === FormElementEvent.FOCUS) {
                node.focus()
            } else if (formType === FormElementEvent.BLUR) {
                node.blur()
            } else if (formType === FormElementEvent.ATTR) {
                if (key) {
                    node[key] = value
                }
            }
            break
    }
}
