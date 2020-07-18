declare interface HTMLInputElement {
    oldValue: string
    value: any
}

import { createFlatVNode } from '@timecat/virtual-dom'
import {
    WindowRecord,
    RecordEvent,
    MouseRecord,
    DOMRecord,
    FormElementRecord,
    RecordData,
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMUpdateDataType,
    UpdateNodeData,
    RemoveUpdateData,
    ScrollRecord,
    movedNodesData,
    RecordType,
    FormElementEvent,
    MouseEventType,
    VNode,
    VSNode
} from '@timecat/share'
import {
    logger,
    throttle,
    isDev,
    nodeStore,
    listenerStore,
    getTime,
    isExistingNode,
    debounce,
    isVNode,
    getStrDiffPatches,
    GS
} from '@timecat/utils'

function emitterHook(emit: RecordEvent<RecordData>, data: RecordData) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function registerEvent(
    eventTypes: string[],
    handleFn: (...args: any[]) => void,
    listenerOptions: AddEventListenerOptions,
    type: 'throttle' | 'debounce' = 'throttle',
    optimizeOptions: { [key: string]: boolean },
    waitTime = 500
) {
    let listenerHandle: (...args: any[]) => void
    if (type === 'throttle') {
        listenerHandle = throttle(handleFn, waitTime, optimizeOptions)
    } else {
        listenerHandle = debounce(handleFn, waitTime, optimizeOptions)
    }

    eventTypes
        .map(type => (fn: (e: Event) => void) => {
            GS.getWindow().addEventListener(type, fn, listenerOptions)
        })
        .forEach(handle => handle(listenerHandle))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            GS.getWindow().removeEventListener(type, listenerHandle, listenerOptions)
        })
    })
}

function WindowRecord(emit: RecordEvent<WindowRecord>) {
    const width = () => window.innerWidth
    const height = () => window.innerHeight

    function emitData(target: Element | Document) {
        emitterHook(emit, {
            type: RecordType.WINDOW,
            data: {
                id: nodeStore.getNodeId(target) || null,
                width: width(),
                height: height()
            },
            time: getTime().toString()
        })
    }

    emitData(GS.getDocument())

    function handleFn(e: Event) {
        const { type, target } = e
        if (type === 'resize') {
            emitData(target as Element | Document)
        }
    }
    registerEvent(['resize'], handleFn, { capture: true }, 'throttle', { trailing: true }, 500)
}

function ScrollRecord(emit: RecordEvent<ScrollRecord>) {
    // const getCompatibleDocument = () => GS.getDocument().documentElement
    const getCompatibleTarget = (target: Document) => (target.scrollingElement as HTMLElement) || target.documentElement
    const scrollTop = (target: Element | HTMLElement) => target.scrollTop
    const scrollLeft = (target: Element | HTMLElement) => target.scrollLeft

    function emitData(target: Element | Document) {
        const element = target instanceof HTMLElement ? target : getCompatibleTarget(target as Document)

        emitterHook(emit, {
            type: RecordType.SCROLL,
            data: {
                id: nodeStore.getNodeId(element) || null, // if null, target is document
                top: scrollTop(element),
                left: scrollLeft(element)
            },
            time: getTime().toString()
        })
    }

    emitData(GS.getDocument())

    function handleFn(e: Event) {
        const { type, target } = e
        if (type === 'scroll') {
            emitData(target as Element | Document)
        }
    }
    registerEvent(['scroll'], handleFn, { capture: true }, 'throttle', { leading: false, trailing: false }, 500)
}

function getOffsetPosition(element: HTMLElement) {
    const doc = element.ownerDocument!
    const frameElement = doc.defaultView!.frameElement as HTMLElement
    const position = {
        x: 0,
        y: 0
    }
    if (frameElement) {
        position.y += frameElement.offsetTop
        position.x += frameElement.offsetLeft
    }
    return position
}

function MouseRecord(emit: RecordEvent<MouseRecord>) {
    function mouseMove() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e.target as HTMLElement)
            emitterHook(emit, {
                type: RecordType.MOUSE,
                data: {
                    type: MouseEventType.MOVE,
                    x: e.x + offsetPosition.x,
                    y: e.y + offsetPosition.y
                },
                time: getTime().toString()
            })
        }
        const name = 'mousemove'
        const listenerHandle = throttle(evt, 300, {
            trailing: true
        })

        GS.getDocument().addEventListener(name, listenerHandle)

        listenerStore.add(() => {
            GS.getDocument().removeEventListener(name, listenerHandle)
        })
    }

    function mouseClick() {
        const evt = (e: MouseEvent) => {
            const offsetPosition = getOffsetPosition(e.target as HTMLElement)

            emitterHook(emit, {
                type: RecordType.MOUSE,
                data: {
                    type: MouseEventType.CLICK,
                    id: nodeStore.getNodeId(e.target as Element),
                    x: e.x + offsetPosition.x,
                    y: e.y + offsetPosition.y
                },
                time: getTime().toString()
            })
        }

        const name = 'click'
        const listenerHandle = throttle(evt, 250)
        listenerStore.add(() => {
            GS.getDocument().removeEventListener(name, listenerHandle)
        })
        GS.getDocument().addEventListener(name, listenerHandle)
    }

    mouseMove()
    mouseClick()
}

function mutationCallback(records: MutationRecord[], emit: RecordEvent<DOMRecord>) {
    const addNodesSet: Set<Node> = new Set()
    const removeNodesMap: Map<Node, Node> = new Map()
    const moveNodesSet: Set<Node> = new Set()
    const moveMarkSet: Set<string> = new Set()

    // A node may modify multiple attributes, so use array(not set)
    const attrNodesArray: { key: string; node: Node; oldValue: string | null }[] = []

    const textNodesSet: Set<Node> = new Set()

    function deepAdd(n: Node, target?: Node) {
        const id = nodeStore.getNodeId(n)
        if (id) {
            if (target) {
                // if exist, go to move and delete in removedSet
                moveNodesSet.add(n)
                removeNodesMap.delete(n)

                const targetId = nodeStore.getNodeId(target)
                if (targetId) {
                    // mark as entry
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

        // shaking node if it hasn't joined the tree
        if (addNodesSet.has(n)) {
            deepDeleteInSet(addNodesSet, n)
            removeNodesMap.set(n, target)
        } else if (moveNodesSet.has(n) && moveMarkSet.has(pId + '@' + id)) {
            deepDeleteInSet(moveNodesSet, n)
            moveMarkSet.delete(pId + '@' + id)
        } else {
            removeNodesMap.set(n, target)
        }
    }

    records.forEach(record => {
        const { target, addedNodes, removedNodes, type, attributeName, oldValue } = record
        switch (type) {
            case 'attributes':
                attrNodesArray.push({ key: attributeName!, node: target, oldValue })
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

    const addedSiblingMap: Map<Node, VNode | VSNode> = new Map()
    addNodesSet.forEach(node => {
        const vn: VNode | VSNode = createFlatVNode(node as Element)
        addedSiblingMap.set(node, vn)
    })

    const addedNodes: UpdateNodeData[] = []
    const addedVNodesMap: Map<number, VNode> = new Map()

    addNodesSet.forEach(node => {
        const parentId = nodeStore.getNodeId(node.parentNode!)!

        const parentVn = addedVNodesMap.get(parentId)

        const isParentSVG = parentVn && parentVn.extra.isSVG

        let vn = addedSiblingMap.get(node)!

        if (isParentSVG && isVNode(vn)) {
            ;(vn as VNode).extra.isSVG = true
        }

        addedNodes.push({
            parentId,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            node: vn
        })

        if (isVNode(vn)) {
            addedVNodesMap.set(vn.id, vn as VNode)
        }
    })

    const movedNodes: movedNodesData[] = []
    moveNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)!
        movedNodes.push({
            parentId: nodeStore.getNodeId(node.parentNode!)!,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            id: nodeId
        })
    })

    const removedNodes: RemoveUpdateData[] = []
    removeNodesMap.forEach((parent, node) => {
        const id = nodeStore.getNodeId(node)!
        const parentId = nodeStore.getNodeId(parent)!

        if (parentId) {
            removedNodes.push({
                parentId,
                id
            })
        }
    })

    const attrs: AttributesUpdateData[] = attrNodesArray
        .map(data => {
            const { node, key, oldValue } = data
            if (isExistingNode(node as Element)) {
                const value = (node as Element).getAttribute(key)
                if (oldValue === value) {
                    return null
                }
                const id = nodeStore.getNodeId(node)
                return {
                    id,
                    key,
                    value
                } as AttributesUpdateData
            }
        })
        .filter(Boolean) as AttributesUpdateData[]

    const texts = [...textNodesSet]
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

    const data = {
        addedNodes,
        movedNodes,
        removedNodes,
        attrs,
        texts
    } as DOMUpdateDataType

    if (Object.values(data).some(item => item.length)) {
        emitterHook(emit, {
            type: RecordType.DOM_UPDATE,
            data,
            time: getTime().toString()
        })
    }
}

function DOMRecord(emit: RecordEvent<DOMRecord>) {
    const Watcher = new MutationObserver(callback => mutationCallback(callback, emit))

    Watcher.observe(GS.getDocument().documentElement, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    })

    listenerStore.add(() => Watcher.disconnect())
}

function FormElementRecord(emit: RecordEvent<FormElementRecord>) {
    listenInputs(emit)

    // for sys write in input
    kidnapInputs(emit)
}

function listenInputs(emit: RecordEvent<FormElementRecord>) {
    const eventTypes = ['input', 'change', 'focus', 'blur']

    eventTypes
        .map(type => (fn: (e: InputEvent) => void) => {
            GS.getDocument().addEventListener(type, fn, { once: false, passive: true, capture: true })
        })
        .forEach(handle => handle(handleFn))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            GS.getDocument().removeEventListener(type, handleFn, true)
        })
    })

    function handleFn(e: InputEvent) {
        const eventType = e.type
        let data!: FormElementRecord
        switch (eventType) {
            case 'input':
            case 'change':
                const target = (e.target as unknown) as HTMLInputElement
                const str = target.value
                let newValue = ''
                const patches: ReturnType<typeof getStrDiffPatches> = []
                if (str === target.oldValue) {
                    return
                }
                if (str.length <= 20 || !target.oldValue) {
                    newValue = str
                } else {
                    patches.push(...getStrDiffPatches(target.oldValue, str))
                }

                data = {
                    type: RecordType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.INPUT,
                        id: nodeStore.getNodeId(e.target as Node)!,
                        value: !patches.length ? newValue : '',
                        patches
                    },
                    time: getTime().toString()
                }

                target.oldValue = str
                break
            case 'focus':
                data = {
                    type: RecordType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.FOCUS,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                }
                break
            case 'blur':
                data = {
                    type: RecordType.FORM_EL_UPDATE,
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

function kidnapInputs(emit: RecordEvent<FormElementRecord>) {
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
            type: RecordType.FORM_EL_UPDATE,
            data,
            time: getTime().toString()
        })
    }
}

export const watchers = {
    WindowRecord,
    ScrollRecord,
    MouseRecord,
    DOMRecord,
    FormElementRecord
}
