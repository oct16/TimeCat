import { createElement } from '@WebReplay/virtual-dom'
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
    removedUpdateData,
    movedUpdateData,
    AddedUpdateData,
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMUpdateDataType,
    InfoObserve
} from './types'
import {
    logger,
    throttle,
    isDev,
    nodeStore,
    listenerStore,
    getTime,
    isElementNode,
    isCommentNode,
    getPos,
    isExistingNode
} from '@WebReplay/utils'
import { VNode } from '@WebReplay/virtual-dom'
import { PosCalculator } from './position'

function emitterHook(emit: SnapshotEvent<SnapshotData>, data: any) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function initInfo(emit: SnapshotEvent<InfoObserve>) {
    const origin = () => window.location.origin
    const pathname = () => window.location.pathname

    emitterHook(emit, {
        type: SnapshotType.INFO,
        data: {
            origin: origin(),
            pathname: pathname()
        },
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
    const addNodesMap: Map<Node, MutationRecord> = new Map()
    const removeNodesMap: Map<Node, MutationRecord> = new Map()
    const moveNodesSet: Set<Node> = new Set()

    const attrNodesMap: Map<Node, string | null> = new Map()
    const textNodesSet: Set<Node> = new Set()
    function addNode(node: Node, record: MutationRecord) {
        if (!node) {
            return
        }

        if (node.nodeType === node.ELEMENT_NODE) {
            // If the node is known, it is a move node
            let nodeId: number | undefined
            if ((nodeId = nodeStore.getNodeId(node))) {
                // Because it is a Set, it will be remove duplicate here
                moveNodesSet.add(node)
            } else {
                addNodesMap.set(node, record)
                return
            }
            return
        } else {
            addNodesMap.set(node, record)
        }
    }

    function rmNode(node: Node, record: MutationRecord) {
        // Deleted after adding
        if (addNodesMap.has(node)) {
            addNodesMap.delete(node)
        }

        // Deleted after moving
        if (moveNodesSet.has(node)) {
            moveNodesSet.delete(node)
        }

        if (!isExistingNode(node)) {
            // Manually marked for deletion
            removeNodesMap.set(node, record)
        }
    }

    records.forEach((record: MutationRecord) => {
        const { target, addedNodes, removedNodes, type, attributeName } = record
        switch (type) {
            case 'attributes':
                attrNodesMap.set(target, attributeName)
                break
            case 'characterData':
                textNodesSet.add(target)
                break
            case 'childList':
                addedNodes.forEach(node => addNode(node, record))
                removedNodes.forEach(node => rmNode(node, record))
                break
            default:
                break
        }
    })

    const posCalculator = new PosCalculator(removeNodesMap)

    const removedList = [...removeNodesMap.entries()]
        .map(entries => {
            const [node, record] = entries
            const { target: parentNode } = record

            const parentId = nodeStore.getNodeId(parentNode)
            if (parentId) {
                if (isElementNode(node)) {
                    const id = nodeStore.getNodeId(node)
                    if (id) {
                        return { parentId, id }
                    }
                    return null
                } else {
                    // textNode or commentNode
                    const pos = posCalculator.nodesRelateMap.get(node) as number
                    return {
                        parentId: nodeStore.getNodeId(parentNode),
                        pos
                    }
                }
            }
            return null
        })
        .filter(Boolean) as removedUpdateData[]
    // .sort((a, b) => {
    //     if (a.pos && b.pos) {
    //         return b.pos - a.pos
    //     }
    //     return 0
    // }) as removedUpdateData[]

    const addPosCalculator = new PosCalculator(addNodesMap)
    const addedList = [...addNodesMap].map(entries => {
        const [node, record] = entries
        let vNode: any
        if (isElementNode(node)) {
            vNode = createElement(node as Element)
        } else if (isCommentNode(node)) {
            vNode = `<!--${node.textContent}-->`
        } else {
            vNode = node.textContent
        }
        const pos = addPosCalculator.nodesRelateMap.get(node)
        return {
            parentId: nodeStore.getNodeId(node.parentNode as Element),
            vNode,
            pos
        } as AddedUpdateData
    })

    const movedList = [...moveNodesSet]
        .filter(node => isExistingNode(node))
        .map(node => {
            const pos = getPos(node)
            const parentId = nodeStore.getNodeId(node.parentNode as Element)
            return {
                id: nodeStore.getNodeId(node),
                parentId,
                pos
            } as movedUpdateData
        })

    const data: DOMUpdateDataType = {
        addedList,
        removedList,
        movedList,
        attrs: [...attrNodesMap.entries()]
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
            .filter(Boolean) as AttributesUpdateData[],
        texts: [...textNodesSet]
            .map(textNode => {
                if (isExistingNode(textNode) && textNode.parentNode) {
                    return {
                        parentId: nodeStore.getNodeId(textNode.parentNode as Element),
                        value: textNode.textContent,
                        pos: getPos(textNode)
                    } as CharacterDataUpdateData
                }
            })
            .filter(Boolean) as CharacterDataUpdateData[]
    }

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
