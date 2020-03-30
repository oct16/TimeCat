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
    WindowObserveData
} from '@WebReplay/snapshot'
import { PlayerComponent } from './player'
import { nodeStore } from '@WebReplay/utils'
import { convertVNode, VNode } from '@WebReplay/virtual-dom'
import { setAttribute } from '../../virtual-dom/src/dom'

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
                switch (mType) {
                    case 'attributes': {
                        const { value, name, nodeId } = data as AttributesUpdateData
                        const targetEl = nodeStore.getNode(nodeId) as HTMLElement
                        if (targetEl) {
                            targetEl.setAttribute(name, value ? value.toString() : '')
                        }
                        break
                    }
                    case 'characterData':
                        {
                            const { pos, value, parentId } = data as CharacterDataUpdateData
                            const parentEl = nodeStore.getNode(parentId) as HTMLElement
                            if (pos !== null) {
                                const target = parentEl.childNodes[pos as number]
                                parentEl.replaceChild(document.createTextNode(value), target)
                            } else {
                                parentEl.innerText = value
                            }
                        }
                        break
                    case 'childList': {
                        Object.entries(data as ChildListUpdateData).forEach(obj => {
                            const [id, item] = obj
                            const parentNode = nodeStore.getNode(+id)
                            if (parentNode) {
                                const { addedNodes, removeIds, attributes } = item

                                removeIds.forEach((removeNodeId: number) => {
                                    if (removeNodeId === 0) {
                                        ;(parentNode as Element).innerHTML = ''
                                    } else {
                                        parentNode.removeChild(nodeStore.getNode(removeNodeId) as Node)
                                    }
                                })

                                addedNodes.forEach((item: any) => {
                                    const { vNode, pos } = item
                                    const targetNode = convertVNode(vNode, null)
                                    if (targetNode) {
                                        parentNode.insertBefore(targetNode, parentNode.childNodes[pos])
                                    }
                                })

                                attributes.forEach((attr: any) => {
                                    const { name, value } = attr
                                    setAttribute(parentNode as HTMLElement, name, value)
                                })
                            }
                        })
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
                    try {
                        node[key] = value
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
            break
    }
}
