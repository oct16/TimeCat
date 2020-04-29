import { createElement, createFlatNode } from '@WebReplay/virtual-dom'
import {
    SnapshotType,
    WindowObserve,
    DOMSnapshot,
    SnapshotEvent,
    MouseSnapshot,
    DOMObserve,
    FormElementObserve,
    FormElementEvent,
    MouseEventType,
    SnapshotData,
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMUpdateDataType,
    InfoObserve,
    InfoData,
    UpdateNodeData,
    RemoveUpdateData
} from './types'
import { logger, throttle, isDev, nodeStore, listenerStore, getTime, isExistingNode } from '@WebReplay/utils'
import { VNode } from '@WebReplay/virtual-dom'

function emitterHook(emit: SnapshotEvent<SnapshotData>, data: any) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function initInfo(emit: SnapshotEvent<InfoObserve>) {
    const { name, publicId, systemId } = window.document.doctype!
    const doctype = () => ({ name, publicId, systemId })
    const origin = () => window.location.origin
    const pathname = () => window.location.pathname

    emitterHook(emit, {
        type: SnapshotType.INFO,
        data: {
            doctype: doctype(),
            origin: origin(),
            pathname: pathname()
        } as InfoData,
        time: getTime().toString()
    })
}

function windowObserve(emit: SnapshotEvent<WindowObserve>) {
    const width = () => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    const height = () => window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    const scrollTop = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
    const scrollLeft = () => window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft

    function emitData() {
        emitterHook(emit, {
            type: SnapshotType.WINDOW,
            data: {
                width: width(),
                height: height(),
                scrollTop: scrollTop(),
                scrollLeft: scrollLeft()
            },
            time: getTime().toString()
        })
    }

    emitData()

    function handleFn(e: Event) {
        const { type } = e
        if (type === 'scroll') {
            emitData()
        }
    }

    const listenerHandle = throttle(handleFn, 500, {
        trailing: true
    })

    const eventTypes = ['scroll']

    eventTypes
        .map(type => (fn: (e: Event) => void) => {
            document.addEventListener(type, fn, { once: false, passive: true, capture: true })
        })
        .forEach(handle => handle(listenerHandle))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            document.removeEventListener(type, listenerHandle, true)
        })
    })
}

function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>) {
    emitterHook(emit, {
        type: SnapshotType.DOM,
        data: {
            vNode: createElement(document.documentElement) as VNode
        },
        time: getTime().toString()
    })
}

function mouseObserve(emit: SnapshotEvent<MouseSnapshot>) {
    function mouseMove() {
        const evt = (e: MouseEvent) => {
            emitterHook(emit, {
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
            emitterHook(emit, {
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

function mutationCallback(records: MutationRecord[], emit: SnapshotEvent<DOMObserve>) {
    const addNodesSet: Set<Node> = new Set()
    const addNodesMap: Map<Node, MutationRecord> = new Map()
    const removeNodesSet: Set<Node> = new Set()
    const removeNodesMap: Map<Node, Node> = new Map()
    const moveNodesSet: Set<Node> = new Set()

    const attrNodesMap: Map<Node, string | null> = new Map()
    const textNodesSet: Set<Node> = new Set()
    const moveMarkSet: Set<string> = new Set()

    function deepAdd(n: Node, target?: Node) {
        // 已存在，移动
        const id = nodeStore.getNodeId(n)
        if (id) {
            moveNodesSet.add(n)
            if (target) {
                const targetId = nodeStore.getNodeId(target)
                if (targetId) {
                    // 标记移动入口
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

        if (addNodesSet.has(n)) {
            deepDeleteInSet(addNodesSet, n)
            removeNodesSet.add(n)
            removeNodesMap.set(n, target)
        } else if (moveNodesSet.has(n) && moveMarkSet.has(pId + '@' + id)) {
            deepDeleteInSet(moveNodesSet, n)
        } else {
            removeNodesSet.add(n)
            removeNodesMap.set(n, target)
        }
    }

    records.forEach(record => {
        const { target, addedNodes, removedNodes, type, attributeName } = record
        switch (type) {
            case 'attributes':
                attrNodesMap.set(target, attributeName)
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

    const addedNodes: UpdateNodeData[] = []
    moveNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)
        addedNodes.push({
            parentId: nodeStore.getNodeId(node.parentNode!)!,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            node: nodeId || createFlatNode(node as Element)
        })
    })
    addNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)
        addedNodes.push({
            parentId: nodeStore.getNodeId(node.parentNode!)!,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            node: nodeId || createFlatNode(node as Element)
        })
    })
    const removedNodes: RemoveUpdateData[] = []
    removeNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)
        const parent = removeNodesMap.get(node)
        removedNodes.push({
            parentId: nodeStore.getNodeId(parent!)!,
            id: nodeId!
        })
    })

    const attrs: AttributesUpdateData[] = [...attrNodesMap.entries()]
        .map(data => {
            const [node, key] = data
            if (isExistingNode(node as Element)) {
                return {
                    id: nodeStore.getNodeId(node),
                    key,
                    value: key ? (node as Element).getAttribute(key) : ''
                } as AttributesUpdateData
            }
        })
        .filter(Boolean) as AttributesUpdateData[]

    const data = {
        addedNodes,
        removedNodes,
        attrs,
        texts: [...textNodesSet]
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
    } as DOMUpdateDataType

    if (Object.values(data).some(item => item.length)) {
        emitterHook(emit, {
            type: SnapshotType.DOM_UPDATE,
            data,
            time: getTime().toString()
        })
    }
}

function DOMObserve(emit: SnapshotEvent<DOMObserve>) {
    const observer = new MutationObserver(callback => mutationCallback(callback, emit))

    observer.observe(document.documentElement, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    })

    listenerStore.add(() => observer.disconnect())
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
        let data!: FormElementObserve
        switch (eventType) {
            case 'input':
            case 'change':
                data = {
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.INPUT,
                        id: nodeStore.getNodeId(e.target as Node)!,
                        value: (e.target as HTMLInputElement).value
                    },
                    time: getTime().toString()
                }
                break
            case 'focus':
                data = {
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.FOCUS,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                }
                break
            case 'blur':
                data = {
                    type: SnapshotType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.BLUR,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                }
                break
            default:
                break
        }

        emitterHook(emit, data)
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
        const data = {
            type: FormElementEvent.PROP,
            id: nodeStore.getNodeId(this)!,
            key,
            value
        }

        emit({
            type: SnapshotType.FORM_EL_UPDATE,
            data,
            time: getTime().toString()
        })
    }
}

export const snapshots = {
    initInfo,
    windowObserve,
    DOMSnapshot,
    mouseObserve,
    DOMObserve,
    formElementObserve
}
