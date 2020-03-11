import { virtualDOM, createElement } from '@WebReplay/virtual-dom'
import {
    SnapshotType,
    WindowSnapshot,
    DOMSnapshot,
    SnapshotEvent,
    MouseSnapshot,
    DOMObserve,
    FormElementObserve,
    FormElementEvent,
    MouseEventType,
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMObserveMutations,
    ChildListUpdateData
} from './types'
import { throttle } from 'lodash-es'
import { nodeStore } from './store/node'
import { VNode } from '../../virtual-dom/src/types'

function windowSnapshot(emit: SnapshotEvent<WindowSnapshot>) {
    const href = window.location.href
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

    emit({
        type: SnapshotType.WINDOW,
        data: {
            width,
            height,
            href
        },
        time: Date.now().toString()
    })
}

function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>) {
    emit({
        type: SnapshotType.DOM,
        data: {
            vNode: virtualDOM.convertHTML(document) as VNode
        },
        time: Date.now().toString()
    })
}

function mouseObserve(emit: SnapshotEvent<MouseSnapshot>) {
    function mouseMove() {
        const evt = (e: MouseEvent) => {
            emit({
                type: SnapshotType.MOUSE,
                data: {
                    type: MouseEventType.MOVE,
                    x: e.x,
                    y: e.y
                },
                time: Date.now().toString()
            })
        }

        document.addEventListener(
            'mousemove',
            throttle(evt, 500, {
                trailing: true
            })
        )
    }

    function mouseClick() {
        const evt = (e: MouseEvent) => {
            emit({
                type: SnapshotType.MOUSE,
                data: {
                    type: MouseEventType.CLICK,
                    id: nodeStore.getNodeId(e.target as Element),
                    x: e.x,
                    y: e.y
                },
                time: Date.now().toString()
            })
        }

        document.addEventListener('click', throttle(evt, 250))
    }

    mouseMove()
    mouseClick()
}

function DOMObserve(emit: SnapshotEvent<DOMObserve>) {
    const callback: MutationCallback = (records: MutationRecord[]) => {
        const mutations: DOMObserveMutations[] = []
        function addMutation(mType: 'attributes' | 'characterData' | 'childList') {
            return function(data: any) {
                mutations.push({
                    mType,
                    data
                })
            }
        }
        records.forEach((record: MutationRecord) => {
            // console.log(record);
            const { target, addedNodes, removedNodes, type, nextSibling, attributeName } = record

            const joinData = addMutation(type)

            switch (type) {
                case 'attributes':
                    if (attributeName) {
                        const curAttrValue = (target as Element).getAttribute(attributeName)
                        joinData({
                            nodeId: nodeStore.getNodeId(target),
                            value: curAttrValue,
                            attr: attributeName
                        } as AttributesUpdateData)
                    }
                    break
                case 'characterData':
                    const parent = target.parentNode!
                    joinData({
                        parentId: nodeStore.getNodeId(parent),
                        value: target.nodeValue,
                        pos: parent.childNodes.length > 0 ? [...parent.childNodes].indexOf(target as ChildNode) : null
                    } as CharacterDataUpdateData)
                    break
                case 'childList':
                    if (addedNodes.length) {
                        addedNodes.forEach(node => {
                            const vNode = createElement(node as HTMLElement)
                            joinData({
                                type: 'add',
                                parentId: nodeStore.getNodeId(target),
                                nodeId: vNode!.id,
                                pos: nextSibling ? nodeStore.getNodeId(nextSibling) : null
                            } as ChildListUpdateData)
                        })
                    }
                    if (removedNodes.length) {
                        removedNodes.forEach(node => {
                            joinData({
                                type: 'delete',
                                parentId: nodeStore.getNodeId(target) as number,
                                nodeId: nodeStore.addNode(node)
                            } as ChildListUpdateData)
                        })
                    }
                    break
                default:
                    break
            }
        })

        if (mutations.length) {
            emit({
                type: SnapshotType.DOM_UPDATE,
                data: {
                    mutations
                },
                time: Date.now().toString()
            })
        }
    }

    const observer = new MutationObserver(callback)
    observer.observe(document.body, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    })
}

function formElementObserve(emit: SnapshotEvent<FormElementObserve>) {
    const els = nodeStore.getAllInputs()

    listenInput(emit) // for sys write in input

    els.forEach(el => {
        el.addEventListener('input', (e: InputEvent) => {
            emit({
                type: SnapshotType.FORM_EL_UPDATE,
                data: {
                    type: FormElementEvent.INPUT,
                    id: nodeStore.getNodeId(e.target as Node)!,
                    value: (e.target as HTMLInputElement).value
                },
                time: Date.now().toString()
            })
        })
        el.addEventListener('focus', (e: InputEvent) => {
            emit({
                type: SnapshotType.FORM_EL_UPDATE,
                data: {
                    type: FormElementEvent.FOCUS,
                    id: nodeStore.getNodeId(e.target as Node)!
                },
                time: Date.now().toString()
            })
        })
        el.addEventListener('blur', (e: InputEvent) => {
            emit({
                type: SnapshotType.FORM_EL_UPDATE,
                data: {
                    type: FormElementEvent.BLUR,
                    id: nodeStore.getNodeId(e.target as Node)!
                },
                time: Date.now().toString()
            })
        })
    })
}

function listenInput(emit: SnapshotEvent<FormElementObserve>) {
    const elementList: [HTMLElement, string][] = [
        [HTMLInputElement.prototype, 'value'],
        [HTMLInputElement.prototype, 'checked'],
        [HTMLSelectElement.prototype, 'value'],
        [HTMLTextAreaElement.prototype, 'value']
    ]

    elementList.forEach(item => {
        const [target, key] = item
        const original = Object.getOwnPropertyDescriptor(target, key)
        Object.defineProperty(target, key, {
            set: function(value: string | boolean) {
                setTimeout(() => {
                    handleEvent.call(this, key, value)
                })
                if (original && original.set) {
                    original.set.call(this, value)
                }
            }
        })
    })

    function handleEvent(this: HTMLElement, key: string, value: string) {
        emit({
            type: SnapshotType.FORM_EL_UPDATE,
            data: {
                type: FormElementEvent.ATTR,
                id: nodeStore.getNodeId(this)!,
                key,
                value
            },
            time: Date.now().toString()
        })
    }

    // const inputProto = HTMLInputElement.prototype
    // const original = Object.getOwnPropertyDescriptor(inputProto, 'value')!
    // Object.defineProperty(inputProto, 'value', {
    //     set: function(value) {
    //         var newValue = arguments.length ? value : this.value
    //         var node = this.attributes.value
    //         if (!node || newValue !== node.value) {
    //             var event = document.createEvent('Event')
    //             event.initEvent('input', true, true)
    //             this.setAttribute('value', newValue)
    //             if (document.documentElement.contains(this)) {
    //                 this.dispatchEvent(event)
    //             }
    //         }
    //         Object.defineProperty(inputProto, 'value', original)
    //     }
    // })
}

export const snapshot = {
    windowSnapshot,
    DOMSnapshot,
    mouseObserve,
    DOMObserve,
    formElementObserve
}
