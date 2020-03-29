import { virtualDOM, createElement } from '@WebReplay/virtual-dom'
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
    AttributesUpdateData,
    CharacterDataUpdateData,
    DOMObserveMutations,
    SnapshotData,
    MutationGroups
} from './types'
import throttle from 'lodash-es/throttle'
import { logger, isDev, nodeStore, listenerStore, getTime } from '@WebReplay/utils'
import { VNode } from '@WebReplay/virtual-dom'

function emitterHook(emit: SnapshotEvent<SnapshotData>, data: any) {
    if (isDev) {
        // logger(data)
    }
    emit(data)
}

function windowObserve(emit: SnapshotEvent<WindowObserve>) {
    const origin = () => window.location.href
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
                origin: origin()
            },
            time: getTime().toString()
        })
    }

    emitData()

    const eventTypes = ['scroll']
    eventTypes
        .map(type => (fn: (e: Event) => void) => {
            document.addEventListener(type, fn, { once: false, passive: true, capture: true })
        })
        .forEach(handle => handle(handleFn))

    listenerStore.add(() => {
        eventTypes.forEach(type => {
            document.removeEventListener(type, handleFn, true)
        })
    })

    function handleFn(e: Event) {
        const { type } = e
        if (type === 'scroll') {
            emitData()
        }
    }
}

function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>) {
    emitterHook(emit, {
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
            emitterHook(
                emit,

                {
                    type: SnapshotType.MOUSE,
                    data: {
                        type: MouseEventType.MOVE,
                        x: e.x,
                        y: e.y
                    },
                    time: getTime().toString()
                }
            )
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

type MutationTypes = 'attributes' | 'characterData' | 'childList'

function DOMObserve(emit: SnapshotEvent<DOMObserve>) {
    const mutationCallback: MutationCallback = (records: MutationRecord[]) => {
        const mGroup = {} as MutationGroups
        const mutations: DOMObserveMutations[] = []

        function addMutation(mType: MutationTypes) {
            return function(data: any) {
                mutations.push({
                    mType,
                    data
                })
            }
        }

        const attrMutations: any = []

        records.forEach((record: MutationRecord) => {
            const { target, addedNodes, removedNodes, type, attributeName } = record

            const joinData = addMutation(type)

            switch (type) {
                case 'attributes':
                    if (attributeName) {
                        const nodeId = nodeStore.getNodeId(target)
                        const curAttrValue = (target as Element).getAttribute(attributeName)
                        attrMutations.push({
                            nodeId,
                            value: curAttrValue,
                            name: attributeName
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
                    const targetId = nodeStore.getNodeId(target)
                    const addedNodesArray = [] as Node[]
                    const removedNodesArray = [] as Node[]
                    // group by targetId
                    addedNodes.forEach(node => addedNodesArray.push(node))
                    removedNodes.forEach(node => removedNodesArray.push(node))
                    if (!targetId) break
                    if (!mGroup[targetId]) {
                        mGroup[targetId] = {
                            addedNodes: [],
                            removedNodes: []
                        }
                    }
                    const { addedNodes: a, removedNodes: r } = mGroup[targetId]
                    a.push(...addedNodesArray)
                    r.push(...removedNodesArray)
                    break
                default:
                    break
            }
        })

        const createGroupObj = (
            addedNodes: {
                vNode: VNode
                pos: number
            }[] = [],
            removeIds: number[] = [],
            attributes: { name: string; value: string }[] = []
        ) => {
            return {
                addedNodes,
                removeIds,
                attributes
            }
        }

        const mutationsGroupResult = Object.keys(mGroup).reduce((result, targetId) => {
            const { addedNodes, removedNodes } = mGroup[targetId]
            result[targetId] = createGroupObj(
                addedNodes
                    .filter(x => !removedNodes.includes(x))
                    .map((n: Element) => {
                        return {
                            vNode: n.nodeType === Node.ELEMENT_NODE ? createElement(n) : n.textContent,
                            pos: [].indexOf.call(n.parentNode!.childNodes, n)
                        }
                    }) as { vNode: VNode; pos: number }[],
                removedNodes
                    .filter(x => !addedNodes.includes(x))
                    .map((n: Element) => nodeStore.getNodeId(n)!)
                    .filter(Boolean)
            )
            return result
        }, {} as MutationGroups)

        attrMutations.forEach((m: AttributesUpdateData) => {
            const { nodeId, ..._m } = m
            if (nodeId) {
                const target = mutationsGroupResult[nodeId]
                if (target) {
                    const attrs = target['attributes']
                    const names = attrs.map(item => item.name)
                    const index = names.indexOf(_m.name)
                    if (!~index) {
                        target['attributes'].push(_m)
                    } else {
                        target['attributes'][index] = _m
                    }
                } else {
                    mutationsGroupResult[nodeId] = createGroupObj(undefined, undefined, [
                        _m as { name: string; value: string }
                    ])
                }
            }
        })

        const joinChildList = addMutation('childList')

        joinChildList(mutationsGroupResult)

        if (mutations.length) {
            emitterHook(emit, {
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
