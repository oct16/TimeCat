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
    ScrollWatcherData,
    VNode,
    VSNode,
    SnapshotData,
    LocationRecordData,
    CanvasRecordData,
    UnionToIntersection
} from '@timecat/share'
import FIXED_CSS from './fixed.scss'
import { PlayerComponent } from './player'
import { nodeStore, isElementNode, isExistingNode, delay, isVNode, revertStrByPatches } from '@timecat/utils'
import { setAttribute, createNode, createSpecialNode, convertVNode } from '@timecat/virtual-dom'

/**
 * if return true then revert
 * @param data
 * @param orderSet
 * @returns true | undefined
 */
function insertOrMoveNode(data: UpdateNodeData, orderSet: Set<number>) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    if (parentNode && isElementNode(parentNode)) {
        let nextNode: Node | null = null

        if (nextId) {
            // Must wait for the relation node inserted first
            if (orderSet.has(nextId)) {
                return true
            }

            nextNode = findNextNode(nextId)
            if (!nextNode) {
                return true
            }
        }
        const n = node as VNode | VSNode

        let insertNode: Node | null

        if (typeof node === 'number') {
            insertNode = nodeStore.getNode(node)!

            if (orderSet.has(node)) {
                orderSet.delete(node)
            }
        } else if (isVNode(n)) {
            insertNode = convertVNode(n as VNode)
        } else {
            insertNode = createSpecialNode(n as VSNode)
        }

        if (insertNode) {
            parentNode.insertBefore(insertNode, nextNode)
        }
    } else {
        return true
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

export async function updateDom(this: PlayerComponent, Record: RecordData | SnapshotData) {
    const { type, data } = Record
    switch (type) {
        case RecordType.SNAPSHOT: {
            const snapshotData = data as SnapshotData['data']
            const { frameId, vNode } = snapshotData

            if (frameId) {
                const iframeNode = nodeStore.getNode(frameId) as HTMLIFrameElement
                if (iframeNode) {
                    const contentDocument = iframeNode.contentDocument!
                    createIframeDOM(contentDocument, snapshotData)
                    injectIframeContent(contentDocument, snapshotData)
                }
            }

            break
        }

        case RecordType.SCROLL: {
            const { top, left, id } = data as ScrollWatcherData
            let target = id ? (nodeStore.getNode(id) as HTMLElement) : this.c.sandBoxDoc.documentElement

            const curTop = target.scrollTop

            // prevent jump too long distance
            const behavior = Math.abs(top - curTop) > window.__ReplayData__.snapshot.data.height * 3 ? 'auto' : 'smooth'
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
        case RecordType.MOUSE: {
            const { x, y, type } = data as MouseRecordData
            if (type === MouseEventType.MOVE) {
                this.pointer.move(x, y)
            } else if (type === MouseEventType.CLICK) {
                this.pointer.click(x, y)
            }
            break
        }
        case RecordType.DOM_UPDATE: {
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
                    if (insertOrMoveNode(addData, orderSet)) {
                        // revert here
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
        }
        case RecordType.FORM_EL_UPDATE: {
            // Reduce the delay caused by interactive animation
            await delay(200)
            const { id, key, type: formType, value, patches } = data as FormElementWatcherData
            const node = nodeStore.getNode(id) as HTMLInputElement | undefined

            if (node) {
                if (formType === FormElementEvent.INPUT || formType === FormElementEvent.CHANGE) {
                    if (patches && patches.length) {
                        const newValue = revertStrByPatches(node.value, patches)
                        node.value = newValue
                    } else if (key) {
                        ;(node as any)[key] = value
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
        }
        case RecordType.LOCATION: {
            const { path, hash, href, contextNodeId } = data as LocationRecordData
            const contextNode = nodeStore.getNode(contextNodeId)

            if (contextNode) {
                const context = contextNode.ownerDocument!.defaultView!
                context.__ReplayLocation__ = { ...context.__ReplayLocation__, ...{ path, hash, href } }
            }
            break
        }
        case RecordType.CANVAS: {
            const { src, id, strokes } = data as UnionToIntersection<CanvasRecordData>
            const target = nodeStore.getNode(id) as HTMLCanvasElement
            const ctx = target.getContext('2d')!

            if (src) {
                const image = new Image()
                image.src = src
                image.onload = function(this: HTMLImageElement) {
                    ctx.drawImage(this, 0, 0)
                }
            } else {
                strokes.forEach(stroke => {
                    const { name, args } = stroke
                    if (Array.isArray(args)) {
                        ;(ctx[name] as Function).apply(ctx, args)
                    } else {
                        const value = args
                        ;(ctx[name] as Object) = value
                    }
                })
            }
        }

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

export function createIframeDOM(contentDocument: Document, snapshotData: SnapshotData['data']) {
    contentDocument.open()
    const doctype = snapshotData.doctype
    const doc = `<!DOCTYPE ${doctype.name} ${doctype.publicId ? 'PUBLIC ' + '"' + doctype.publicId + '"' : ''} ${
        doctype.systemId ? '"' + doctype.systemId + '"' : ''
    }><html><head></head><body></body></html>`
    contentDocument.write(doc)
}

export function injectIframeContent(contentDocument: Document, snapshotData: SnapshotData['data']) {
    const content = convertVNode(snapshotData.vNode)
    if (content) {
        const head = content.querySelector('head')
        if (head) {
            const style = document.createElement('style')
            style.innerHTML = FIXED_CSS
            head.appendChild(style)
        }
        const documentElement = contentDocument.documentElement
        content.scrollLeft = snapshotData.scrollLeft
        content.scrollTop = snapshotData.scrollTop
        contentDocument.replaceChild(content, documentElement)
    }
}
