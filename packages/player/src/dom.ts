import {
    RecordData,
    MouseRecordData,
    FormElementWatcherData,
    RecordType,
    MouseEventType,
    CharacterDataUpdateData,
    AttributesUpdateData,
    FormElementEvent,
    WindowWatcherData,
    UpdateNodeData,
    RemoveUpdateData,
    DOMUpdateDataType,
    ScrollWatcherData
} from '@TimeCat/record'
import { PlayerComponent } from './player'
import { nodeStore, isElementNode, isExistingNode, delay, isVNode, revertStrByPatches } from '@TimeCat/utils'
import { setAttribute, VNode, VSNode, createNode, createSpecialNode } from '@TimeCat/virtual-dom'

function insertOrMoveNode(data: UpdateNodeData, orderSet: Set<number>) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    if (parentNode && isElementNode(parentNode)) {
        let nextNode: Node | null = null

        if (nextId) {
            // Must wait for the relation node inserted first
            if (orderSet.has(nextId)) {
                return 'revert'
            }

            nextNode = findNextNode(nextId)
            if (!nextNode) {
                return 'revert'
            }
        }
        const n = node as VNode | VSNode

        let insertNode: Node
        if (typeof node === 'number') {
            insertNode = nodeStore.getNode(node)!

            if (orderSet.has(node)) {
                orderSet.delete(node)
            }
        } else if (isVNode(n)) {
            insertNode = createNode(n as VNode)
        } else {
            insertNode = createSpecialNode(n as VSNode)
        }

        parentNode.insertBefore(insertNode, nextNode)
    } else {
        return 'revert'
    }
}

function isChildNode(parentNode: Node, childNode: Node) {
    if (isElementNode(parentNode)) {
        const childNodes = parentNode.childNodes
        return [...childNodes].indexOf(childNode as ChildNode) !== -1
    }
    return false
}

function findNextNode(nextId: number | null): Node | null {
    return nextId ? nodeStore.getNode(nextId) : null
}

export async function updateDom(this: PlayerComponent, Record: RecordData) {
    const { type, data } = Record
    switch (type) {
        case RecordType.SCROLL: {
            const { top, left, id } = data as ScrollWatcherData
            let target = (id as number | null)
                ? (nodeStore.getNode(id) as HTMLElement)
                : this.c.sandBoxDoc.documentElement

            const curTop = target.scrollTop

            // prevent jump too long distance
            const behavior = Math.abs(top - curTop) > window.__ReplayData__.snapshot.height * 3 ? 'auto' : 'smooth'
            target.scrollTo({
                top,
                left,
                behavior
            })

            break
        }
        case RecordType.WINDOW: {
            const { width, height, id } = data as WindowWatcherData
            let target: HTMLElement
            if (id) {
                target = nodeStore.getNode(id) as HTMLElement
                ;(target as HTMLElement).style.width = width + 'px'
                ;(target as HTMLElement).style.height = height + 'px'
            } else {
                target = this.c.sandBoxDoc.body
                this.c.resize(width, height)
            }
            break
        }
        case RecordType.MOUSE:
            const { x, y, type } = data as MouseRecordData
            if (type === MouseEventType.MOVE) {
                this.pointer.move(x, y)
            } else if (type === MouseEventType.CLICK) {
                this.pointer.click(x, y)
            }
            break
        case RecordType.DOM_UPDATE:
            // Reduce the delay caused by interactive animation
            await delay(200)
            const { addedNodes, movedNodes, removedNodes, attrs, texts } = data as DOMUpdateDataType
            removedNodes.forEach((data: RemoveUpdateData) => {
                const { parentId, id } = data
                const parentNode = nodeStore.getNode(parentId)
                const node = nodeStore.getNode(id)
                if (node && parentNode && parentNode.contains(node)) {
                    parentNode.removeChild(node as Node)
                }
            })

            const movedList = movedNodes.slice()

            // node1 -> node2 -> node3
            // insert node2 first
            // insert node1 last
            // => if nextId equal id, insert id first

            const orderSet: Set<number> = new Set()
            movedList.forEach(data => {
                // Is there a relations between two nodes
                if (data.nextId) {
                    if (movedList.some(a => a.id === data.nextId)) {
                        orderSet.add(data.nextId)
                    }
                }
            })

            const addedList = movedList
                .map(item => {
                    const { id, parentId, nextId } = item
                    return {
                        node: id,
                        parentId,
                        nextId
                    } as UpdateNodeData
                })
                .concat(addedNodes.slice())

            // Math Termial
            const n = addedList.length
            const maxRevertCount = n > 0 ? (n * n + n) / 2 : 0
            let revertCount = 0

            while (addedList.length) {
                const addData = addedList.shift()
                if (addData) {
                    const revertSignal = insertOrMoveNode(addData, orderSet)
                    if (revertSignal === 'revert') {
                        if (revertCount++ < maxRevertCount) {
                            addedList.push(addData)
                        }
                    }
                }
            }

            attrs.forEach((attr: AttributesUpdateData) => {
                const { id, key, value } = attr
                const node = nodeStore.getNode(id) as HTMLElement

                if (node) {
                    setAttribute(node as HTMLElement, key, value)
                }
            })

            texts.forEach((text: CharacterDataUpdateData) => {
                const { id, value, parentId } = text
                const parentNode = nodeStore.getNode(parentId) as HTMLElement
                const node = nodeStore.getNode(id) as HTMLElement

                if (parentNode && node) {
                    if (isExistingNode(node)) {
                        node.textContent = value
                        return
                    }
                    parentNode.innerText = value
                }
            })
            break
        case RecordType.FORM_EL_UPDATE:
            // Reduce the delay caused by interactive animation
            await delay(200)
            const { id, key, type: formType, value, patches } = data as FormElementWatcherData
            const node = nodeStore.getNode(id) as HTMLInputElement | undefined

            if (node) {
                if (formType === FormElementEvent.INPUT) {
                    if (value) {
                        node.value = value!
                    } else if (patches && patches.length) {
                        const newValue = revertStrByPatches(node.value, patches)
                        node.value = newValue
                    }
                } else if (formType === FormElementEvent.FOCUS) {
                    node.focus()
                } else if (formType === FormElementEvent.BLUR) {
                    node.blur()
                } else if (formType === FormElementEvent.PROP) {
                    if (key) {
                        ;(node as any)[key] = value
                    }
                }
            }
            break
        default: {
            break
        }
    }
}

export function showStartMask() {
    const startPage = document.querySelector('#cat-start-page')! as HTMLElement
    startPage.setAttribute('style', '')
}

function showStartBtn() {
    const startPage = document.querySelector('#cat-start-page')! as HTMLElement
    const btn = startPage.querySelector('.play-btn') as HTMLElement
    btn.classList.add('show')
    return btn
}

export function removeStartPage() {
    const startPage = document.querySelector('#cat-start-page') as HTMLElement
    startPage.parentElement!.removeChild(startPage)
}

export async function waitStart(): Promise<void> {
    const btn = showStartBtn()
    return new Promise(r => {
        btn.addEventListener('click', async () => {
            btn.classList.remove('show')
            await delay(500)
            r()
        })
    })
}
