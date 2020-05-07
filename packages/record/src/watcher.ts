import { createFlatNode } from '@WebReplay/virtual-dom'
import {
    RecordType,
    WindowWatcher,
    RecordEvent,
    MouseRecord,
    DOMWatcher,
    FormElementWatcher,
    FormElementEvent,
    MouseEventType,
    RecordData,
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMUpdateDataType,
    UpdateNodeData,
    RemoveUpdateData,
    ScrollWatcher
} from './types'
import { logger, throttle, isDev, nodeStore, listenerStore, getTime, isExistingNode } from '@WebReplay/utils'

function emitterHook(emit: RecordEvent<RecordData>, data: any) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function registerEvent(eventTypes: string[], handleFn: Function, opts: AddEventListenerOptions, throttleTime = 500) {
    const listenerHandle = throttle(handleFn, throttleTime, {
        trailing: true
    })

    eventTypes
        .map(type => (fn: (e: Event) => void) => {
            window.addEventListener(type, fn, opts)
        })
        .forEach(handle => handle(listenerHandle))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            window.removeEventListener(type, listenerHandle, opts)
        })
    })
}

function windowWatcher(emit: RecordEvent<WindowWatcher>) {
    const width = () => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    const height = () => window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

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

    emitData(document)

    function handleFn(e: Event) {
        
        const { type, target } = e
        if (type === 'resize') {
            emitData(target as Element | Document)
        }
    }
    registerEvent(['resize'], handleFn, { capture: true })
}

function scrollWatcher(emit: RecordEvent<ScrollWatcher>) {
    const scrollTop = (target: HTMLElement) => target.scrollTop
    const scrollLeft = (target: HTMLElement) => target.scrollLeft

    function emitData(target: Element | Document) {
        const el = target instanceof Document ? document.documentElement : (target as HTMLElement)
        emitterHook(emit, {
            type: RecordType.SCROLL,
            data: {
                id: nodeStore.getNodeId(target) || null, // if null, target is document
                top: scrollTop(el),
                left: scrollLeft(el)
            },
            time: getTime().toString()
        })
    }

    emitData(document)

    function handleFn(e: Event) {
        const { type, target } = e
        if (type === 'scroll') {
            emitData(target as Element | Document)
        }
    }
    registerEvent(['scroll'], handleFn, { capture: true })
}

function mouseWatcher(emit: RecordEvent<MouseRecord>) {
    function mouseMove() {
        const evt = (e: MouseEvent) => {
            emitterHook(emit, {
                type: RecordType.MOUSE,
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
                type: RecordType.MOUSE,
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

function mutationCallback(records: MutationRecord[], emit: RecordEvent<DOMWatcher>) {
    const addNodesSet: Set<Node> = new Set()
    const removeNodesMap: Map<Node, Node> = new Map()
    const moveNodesSet: Set<Node> = new Set()
    const moveMarkSet: Set<string> = new Set()

    const attrNodesMap: Map<Node, string | null> = new Map()
    const textNodesSet: Set<Node> = new Set()

    function deepAdd(n: Node, target?: Node) {
        const id = nodeStore.getNodeId(n)
        if (id) {
            // if exist, go to move
            moveNodesSet.add(n)
            if (target) {
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

    addNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)
        addedNodes.push({
            parentId: nodeStore.getNodeId(node.parentNode!)!,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            node: nodeId || createFlatNode(node as Element)
        })
    })

    moveNodesSet.forEach(node => {
        const nodeId = nodeStore.getNodeId(node)
        addedNodes.push({
            parentId: nodeStore.getNodeId(node.parentNode!)!,
            nextId: nodeStore.getNodeId(node.nextSibling!) || null,
            node: nodeId || createFlatNode(node as Element)
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

function DOMWatcher(emit: RecordEvent<DOMWatcher>) {
    const Watcher = new MutationObserver(callback => mutationCallback(callback, emit))

    Watcher.observe(document.documentElement, {
        attributeOldValue: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    })

    listenerStore.add(() => Watcher.disconnect())
}

function formElementWatcher(emit: RecordEvent<FormElementWatcher>) {
    listenInputs(emit)

    // for sys write in input
    kidnapInputs(emit)
}

function listenInputs(emit: RecordEvent<FormElementWatcher>) {
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
        let data!: FormElementWatcher
        switch (eventType) {
            case 'input':
            case 'change':
                data = {
                    type: RecordType.FORM_EL_UPDATE,
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

function kidnapInputs(emit: RecordEvent<FormElementWatcher>) {
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
    windowWatcher,
    scrollWatcher,
    mouseWatcher,
    DOMWatcher,
    formElementWatcher
}
