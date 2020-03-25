import {
    SnapshotData,
    MouseSnapshotData,
    DOMObserveData,
    FormElementObserveData,
    SnapshotType,
    MouseEventType,
    DOMObserveMutations,
    ChildListUpdateData,
    CharacterDataUpdateData,
    AttributesUpdateData,
    FormElementEvent,
    ChildListUpdateDataType,
    WindowObserveData
} from '@WebReplay/snapshot'
import { PlayerComponent } from './player'
import { nodeStore } from '@WebReplay/utils'
import { convertVNode } from '@WebReplay/virtual-dom'

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
            const { mutations } = data as DOMObserveData
            mutations.forEach((mutate: DOMObserveMutations) => {
                const { mType, data } = mutate
                const { value, attr, type, parentId, pos, nodeId, vNode } = data as ChildListUpdateData &
                    (CharacterDataUpdateData & AttributesUpdateData)
                switch (mType) {
                    case 'attributes':
                        const targetEl = nodeStore.getNode(nodeId) as HTMLElement
                        if (targetEl) {
                            targetEl.setAttribute(attr, value ? value : '')
                        }

                        break
                    case 'characterData':
                        const parentEl = nodeStore.getNode(parentId) as HTMLElement
                        if (pos !== null) {
                            const target = parentEl.childNodes[pos as number]
                            parentEl.replaceChild(document.createTextNode(value), target)
                        } else {
                            parentEl.innerText = value
                        }
                        break
                    case 'childList':
                        const parentNode = nodeStore.getNode(parentId) as HTMLElement
                        const targetNode = (nodeStore.getNode(nodeId) as Element) || convertVNode(vNode, null)
                        if (type === ChildListUpdateDataType.DELETE) {
                            if (targetNode) {
                                parentNode!.removeChild(targetNode)
                            }
                        } else if (ChildListUpdateDataType.ADD) {
                            if (typeof value === 'string') {
                                // it's a TextNode
                                const textNode = document.createTextNode(value)
                                if (parentNode.childNodes.length) {
                                    parentNode.replaceChild(textNode, parentNode.childNodes[pos])
                                } else {
                                    parentNode!.appendChild(textNode)
                                }
                            } else {
                                // it's a ElementNode
                                if (parentNode && targetNode) {
                                    parentNode.insertBefore(targetNode, parentNode.childNodes[pos])
                                } else {
                                    console.warn('insert error', data)
                                }
                            }
                        }
                        break
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
                node[key!] = value
            }
            break
    }
}
