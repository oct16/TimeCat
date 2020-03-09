import { virtualDOM } from '@WebReplay/virtual-dom'
import {
    SnapshotType,
    WindowSnapshot,
    DOMSnapshot,
    SnapshotEvent,
    MouseSnapshot,
    DOMObserve,
    FormElementObserve,
    FormElementEvent,
    MouseEventType
} from './types'
import { throttle } from 'lodash-es'
import { nodeStore } from './store/node'

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
            vNode: virtualDOM.convertHTML(document)
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
    function domUpdate() {
        const callback: MutationCallback = (records: MutationRecord[]) => {
            const mutations: any[] = []
            records.forEach(record => {
                const { target, addedNodes, removedNodes } = record

                if (addedNodes.length) {
                    addedNodes.forEach(node => {
                        const nodeId = nodeStore.addNode(node)
                        mutations.push({
                            type: 'add',
                            parentId: nodeStore.getNodeId(target),
                            nodeId
                        })
                    })
                }

                if (removedNodes.length) {
                    removedNodes.forEach(node => {
                        mutations.push({
                            type: 'delete',
                            parentId: nodeStore.getNodeId(target),
                            nodeId: nodeStore.getNodeId(node)
                        })
                    })
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

    domUpdate()
}

function FormElementObserve(emit: SnapshotEvent<FormElementObserve>) {
    const els = nodeStore.getAllInputs()

    listenInputInteractive() // for sys write in input

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

function listenInputInteractive() {
    const inputProto = HTMLInputElement.prototype
    Object.defineProperty(inputProto, 'value', {
        set: function(value) {
            var newValue = arguments.length ? value : this.value
            var node = this.attributes.value
            if (!node || newValue !== node.value) {
                var event = document.createEvent('Event')
                event.initEvent('input', true, true)
                this.setAttribute('value', newValue)
                if (document.documentElement.contains(this)) {
                    this.dispatchEvent(event)
                }
            }
        }
    })
}

export const snapshot = {
    windowSnapshot,
    DOMSnapshot,
    mouseObserve,
    DOMObserve,
    FormElementObserve
}
