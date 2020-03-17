import { virtualDOM, createElement, convertVNode } from '@WebReplay/virtual-dom'
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
    ChildListUpdateData,
    ChildListUpdateDataType
} from './types'
import { throttle } from 'lodash-es'
import { nodeStore, listenerStore, getTime } from '@WebReplay/utils'
import { VNode } from '@WebReplay/virtual-dom'

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
        time: getTime().toString()
    })
}

function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>) {
    emit({
        type: SnapshotType.DOM,
        data: {
            vNode: virtualDOM.convertHTML(document) as VNode
        },
        time: getTime().toString()
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
                time: getTime().toString()
            })
        }
        const name = 'mousemove'
        const listenerHandle = throttle(evt, 100, {
            trailing: true
        })

        document.addEventListener(name, listenerHandle)

        listenerStore.add(() => {
            document.removeEventListener(name, listenerHandle)
        })
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
                time: getTime().toString()
            })
        }

        const name = 'click'
        const listenerHandle = throttle(evt, 250)
        listenerStore.add(() => {
            document.removeEventListener(name, listenerHandle)
        })
        document.addEventListener(name, listenerHandle)
    }

    mouseMove()
    mouseClick()
}

function DOMObserve(emit: SnapshotEvent<DOMObserve>) {
    const mutationCallback: MutationCallback = (records: MutationRecord[]) => {
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
                            let text
                            let vNode: any
                            if (node.nodeType === Node.TEXT_NODE) {
                                text = node.nodeValue
                                const pos = Array.from(node.parentNode!.childNodes).indexOf(node as ChildNode)
                                joinData({
                                    type: ChildListUpdateDataType.ADD,
                                    parentId: nodeStore.getNodeId(node.parentNode!),
                                    value: node.textContent,
                                    pos
                                } as ChildListUpdateData)
                            } else {
                                // reset element for remove reference
                                vNode = createElement(node as HTMLElement)
                                // convertVNode(vNode, null)
                                const parent = node.parentNode!
                                joinData({
                                    type: ChildListUpdateDataType.ADD,
                                    parentId: nodeStore.getNodeId(target),
                                    vNode,
                                    pos:
                                        parent.childNodes.length > 0
                                            ? [...parent.childNodes].indexOf(node as ChildNode)
                                            : null
                                } as ChildListUpdateData)
                            }
                        })
                    }
                    if (removedNodes.length) {
                        removedNodes.forEach(node => {
                            joinData({
                                type: ChildListUpdateDataType.DELETE,
                                parentId: nodeStore.getNodeId(target) as number,
                                nodeId: nodeStore.getNodeId(node) || null
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
                time: getTime().toString()
            })
        }
    }

    const observer = new MutationObserver(mutationCallback)
    observer.observe(document.body, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    })

    listenerStore.add(() => {
        observer.disconnect()
    })
}

function formElementObserve(emit: SnapshotEvent<FormElementObserve>) {
    listenInputs(emit)
    kidnapInputs(emit) // for sys write in input
}

function listenInputs(emit: SnapshotEvent<FormElementObserve>) {
    const eventTypes = ['input', 'change', 'focus', 'blur']

    eventTypes
        .map(type => (fn: (e: InputEvent) => void) => {
            document.addEventListener(type, fn, { once: false, passive: true, capture: true })
        })
        .forEach(handle => handle(handleFn))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            document.removeEventListener(type, handleFn, true)
        })
    })

    function handleFn(e: InputEvent) {
        const eventType = e.type

        switch (eventType) {
            case 'input':
            case 'change':
                emit({
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.INPUT,
                        id: nodeStore.getNodeId(e.target as Node)!,
                        value: (e.target as HTMLInputElement).value
                    },
                    time: getTime().toString()
                })
                break
            case 'focus':
                emit({
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.FOCUS,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                })
                break
            case 'blur':
                emit({
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.BLUR,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                })
                break
            default:
                break
        }
    }
}

function kidnapInputs(emit: SnapshotEvent<FormElementObserve>) {
    const elementList: [HTMLElement, string][] = [
        [HTMLInputElement.prototype, 'value'],
        [HTMLInputElement.prototype, 'checked'],
        [HTMLSelectElement.prototype, 'value'],
        [HTMLTextAreaElement.prototype, 'value']
    ]

    const handles = elementList.map(item => {
        return () => {
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

            listenerStore.add(() => {
                if (original) {
                    Object.defineProperty(target, key, original)
                }
            })
        }
    })

    handles.concat([]).forEach(handle => handle())

    function handleEvent(this: HTMLElement, key: string, value: string) {
        emit({
            type: SnapshotType.FORM_EL_UPDATE,
            data: {
                type: FormElementEvent.ATTR,
                id: nodeStore.getNodeId(this)!,
                key,
                value
            },
            time: getTime().toString()
        })
    }
}

export const snapshots = {
    windowSnapshot,
    DOMSnapshot,
    mouseObserve,
    DOMObserve,
    formElementObserve
}
