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
    DOMUpdateDataType
} from './types'
import {
    logger,
    throttle,
    isTextNode,
    isDev,
    nodeStore,
    listenerStore,
    getTime,
    isElementNode,
    removeItem,
    isCommentNode,
    getPos,
    getAllChildNodes
} from '@WebReplay/utils'
import { VNode } from '@WebReplay/virtual-dom'

function emitterHook(emit: SnapshotEvent<SnapshotData>, data: any) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function windowObserve(emit: SnapshotEvent<WindowObserve>) {
    const origin = () => window.location.origin
    const pathname = () => window.location.pathname
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
                scrollLeft: scrollLeft(),
                origin: origin(),
                pathname: pathname()
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

function DOMObserve(emit: SnapshotEvent<DOMObserve>) {
    const mutationCallback: MutationCallback = (records: MutationRecord[]) => {
        const addNodesSet: Set<Node> = new Set()
        const newNodes: Set<Node> = new Set()
        const removeNodesSet: Set<Node> = new Set()
        const moveNodesSet: Set<Node> = new Set()
        const nMap: Map<Node, number> = new Map()
        const attrNodesMap: Map<Node, string | null> = new Map()
        const textNodesSet: Set<Node> = new Set()
        
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
                    removedNodes.forEach(node => {
                        removeNodesSet.add(node)
                        nMap.set(node, nodeStore.getNodeId(target)!)
                    })
                    addedNodes.forEach(node => addNodesSet.add(node))
                    addNodesSet.forEach(node => {
                        if (!removeNodesSet.has(node)) {
                            newNodes.add(node)
                        } else {
                            moveNodesSet.add(node)
                        }
                    })
                    break
                default:
                    break
            }
        })

        const removeNodes: Node[] = [...removeNodesSet].filter(node => !document.documentElement.contains(node))

        const removeNodeChildNodesSet: Set<Node> = getAllChildNodes([...removeNodesSet])!

        const addNodes: Node[] = [
            ...new Set(
                [...newNodes].filter(node => {
                    if (!removeNodeChildNodesSet.has(node)) {
                        return true
                    } else {
                        removeItem(removeNodes, node)
                    }
                })
            )
        ]

        const moveNodes: Node[] = [...moveNodesSet].filter(node => !newNodes.has(node) && !removeNodes.includes(node))

        const removedNodesMutation: removedUpdateData[] = []
        const removedAllIds: number[] = []

        removeNodes
            .sort((a: Node) => {
                return a.nodeType === Node.TEXT_NODE ? -1 : 1
            })
            .forEach(node => {
                const parentId = nMap.get(node)!
                if (!removedAllIds.includes(parentId)) {
                    // if exist text_node, means to set innerHtml or set innerText to remove all childNodes
                    if (isTextNode(node)) {
                        removedAllIds.push(parentId)
                    } else if (isElementNode(node)) {
                        const inAddNodesIndex = addNodes.indexOf(node)
                        if (inAddNodesIndex === -1) {
                            removedNodesMutation.push({
                                parentId,
                                id: nodeStore.getNodeId(node)!
                            })
                        } else {
                            addNodes.splice(inAddNodesIndex, 1)
                        }
                    }
                }
            })

        const data: DOMUpdateDataType = {
            addedList: addNodes.map(node => {
                let vNode: any
                if (isElementNode(node)) {
                    vNode = createElement(node as Element)
                } else if (isCommentNode(node)) {
                    vNode = `<!--${node.textContent}-->`
                } else {
                    vNode = node.textContent
                }
                return {
                    parentId: nodeStore.getNodeId(node.parentNode as Element),
                    vNode,
                    pos: getPos(node)
                } as AddedUpdateData
            }),
            removedList: removedNodesMutation,
            removedAllList: removedAllIds,
            movedList: moveNodes.map(node => {
                const pos = getPos(node)
                const parentId = nodeStore.getNodeId(node.parentNode as Element)
                return {
                    id: nodeStore.getNodeId(node),
                    parentId,
                    pos
                } as movedUpdateData
            }),
            attrs: [...attrNodesMap.entries()]
                .map(data => {
                    const [node, key] = data
                    if (document.documentElement.contains(node as Element)) {
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
                    if (
                        document.documentElement.contains(textNode as Node) &&
                        document.documentElement.contains(textNode.parentNode)
                    ) {
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

    const observer = new MutationObserver(mutationCallback)

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
    windowObserve,
    DOMSnapshot,
    mouseObserve,
    DOMObserve,
    formElementObserve
}
