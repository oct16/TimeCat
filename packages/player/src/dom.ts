import {
    RecordData,
    MouseRecordData,
    FormElementRecordData,
    RecordType,
    MouseEventType,
    CharacterDataUpdateData,
    AttributesUpdateData,
    FormElementEvent,
    WindowRecordData,
    UpdateNodeData,
    RemoveUpdateData,
    DOMRecordData,
    ScrollRecordData,
    VNode,
    VSNode,
    LocationRecordData,
    CanvasRecordData,
    UnionToIntersection,
    SnapshotRecord,
    FontRecordData
} from '@timecat/share'
import FIXED_CSS from './fixed.scss'
import { PlayerComponent } from './components/player'
import { nodeStore, isElementNode, isExistingNode, delay, isVNode, revertStrByPatches } from '@timecat/utils'
import { setAttribute, createSpecialNode, convertVNode } from '@timecat/virtual-dom'
import { ContainerComponent } from './components/container'

/**
 * if return true then revert
 * @param data
 * @param orderSet
 * @returns true | undefined
 */
function insertOrMoveNode(data: UpdateNodeData, orderSet: Set<number>) {
    const { parentId, nextId, node } = data
    const parentNode = nodeStore.getNode(parentId!)

    const findNextNode = (nextId: number | null): Node | null => {
        return nextId ? nodeStore.getNode(nextId) : null
    }

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

            if (!parentNode.contains(nextNode)) {
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

export async function updateDom(this: PlayerComponent, Record: RecordData) {
    const { type, data } = Record
    switch (type) {
        case RecordType.SNAPSHOT: {
            const snapshotData = data as SnapshotRecord['data']
            const { frameId } = snapshotData

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
            const { top, left, id } = data as ScrollRecordData
            const target = id ? (nodeStore.getNode(id) as HTMLElement) : this.c.sandBoxDoc.documentElement

            if (!target) {
                return
            }

            const curTop = target.scrollTop

            // prevent jump too long distance
            const behavior = Math.abs(top - curTop) > window.G_REPLAY_DATA.snapshot.data.height * 3 ? 'auto' : 'smooth'

            target.scroll({
                top,
                left,
                behavior
            })
            break
        }
        case RecordType.WINDOW: {
            const { width, height, id } = data as WindowRecordData
            let target: HTMLElement
            if (id) {
                target = nodeStore.getNode(id) as HTMLElement
                ;(target as HTMLElement).style.width = width + 'px'
                ;(target as HTMLElement).style.height = height + 'px'
            } else {
                target = this.c.sandBoxDoc.body
                this.c.resize({ setWidth: width, setHeight: height })
            }
            break
        }
        case RecordType.MOUSE: {
            const { x, y, id, type } = data as MouseRecordData

            let left = 0,
                top = 0

            if (id) {
                const node = nodeStore.getNode(id) as HTMLElement
                let rect = {}
                if (node && node.getBoundingClientRect) {
                    rect = node.getBoundingClientRect()
                }
                const { left: nodeLeft, top: nodeTop } = rect as any
                left = nodeLeft
                top = nodeTop
            }

            if (type === MouseEventType.MOVE) {
                this.pointer.move(x + left, y + top)
            } else if (type === MouseEventType.CLICK) {
                this.pointer.click(x + left, y + top)
            }
            break
        }
        case RecordType.DOM: {
            // Reduce the delay caused by interactive animation
            await actionDelay()
            const { addedNodes, movedNodes, removedNodes, attrs, texts } = data as DOMRecordData
            removedNodes &&
                removedNodes.forEach((data: RemoveUpdateData) => {
                    const { parentId, id } = data
                    const parentNode = nodeStore.getNode(parentId)
                    const node = nodeStore.getNode(id)
                    if (node && parentNode && parentNode.contains(node)) {
                        parentNode.removeChild(node as Node)
                    }
                })

            const orderSet: Set<number> = new Set()
            const movedList = (movedNodes && movedNodes.slice()) || []

            // node1 -> node2 -> node3
            // insert node2 first
            // insert node1 last
            // => if nextId equal id, insert id first

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
                .concat((addedNodes && addedNodes.slice()) || [])

            // Math Termial
            if (addedList) {
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
            }

            attrs &&
                attrs.forEach((attr: AttributesUpdateData) => {
                    const { id, key, value } = attr
                    const node = nodeStore.getNode(id) as HTMLElement

                    if (node) {
                        if (node.tagName === 'IFRAME' && key === 'src') {
                            setAttribute(node as HTMLElement, 'disabled-src', value)
                            setAttribute(node as HTMLElement, 'src', null)
                            return
                        }
                        setAttribute(node as HTMLElement, key, value)
                    }
                })

            texts &&
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
        case RecordType.FORM_EL: {
            // Reduce the delay caused by interactive animation
            await actionDelay()
            const { id, key, type: formType, value, patches } = data as FormElementRecordData
            const node = nodeStore.getNode(id) as HTMLInputElement | undefined
            const { mode } = window.G_REPLAY_OPTIONS

            if (node) {
                if (formType === FormElementEvent.INPUT || formType === FormElementEvent.CHANGE) {
                    if (patches && patches.length) {
                        const newValue = revertStrByPatches(node.value, patches)
                        node.value = newValue
                    } else if (key) {
                        ;(node as any)[key] = value
                    }
                } else if (formType === FormElementEvent.FOCUS) {
                    if (mode === 'live') {
                        return
                    }
                    node.focus && node.focus()
                } else if (formType === FormElementEvent.BLUR) {
                    node.blur && node.blur()
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
                context.G_REPLAY_LOCATION = { ...context.G_REPLAY_LOCATION, ...{ path, hash, href } }
            }
            break
        }
        case RecordType.CANVAS: {
            await actionDelay()
            renderCanvas(data as CanvasRecordData)
            break
        }
        case RecordType.FONT: {
            const { family, source } = data as FontRecordData
            const buffer = new Uint8Array(source.length)
            for (let i = 0; i < source.length; i++) {
                const code = source.charCodeAt(i)
                buffer[i] = code
            }
            const font = new window.FontFace(family, buffer)
            this.c.sandBoxDoc.fonts.add(font)
            document.fonts.add(font)
            break
        }
        default: {
            break
        }
    }
}

export function showStartMask(c: ContainerComponent) {
    const startPage = c.container.querySelector('.player-start-page')! as HTMLElement
    startPage.setAttribute('style', '')
}

function showStartBtn(el: HTMLElement) {
    const startPage = el.querySelector('.player-start-page')! as HTMLElement
    const btn = startPage.querySelector('.play-btn') as HTMLElement
    btn.classList.add('show')
    return btn
}

export function removeStartPage(el: HTMLElement) {
    const startPage = el.querySelector('.player-start-page') as HTMLElement
    startPage?.parentElement?.removeChild(startPage)
}

export async function waitStart(el: HTMLElement): Promise<void> {
    const btn = showStartBtn(el)
    return new Promise(r => {
        btn.addEventListener('click', async () => {
            btn.classList.remove('show')
            await delay(500)
            r()
        })
    })
}

export function createIframeDOM(contentDocument: Document, snapshotData: SnapshotRecord['data']) {
    contentDocument.open()
    const doctype = snapshotData.doctype
    const doc = `<!DOCTYPE ${doctype.name} ${doctype.publicId ? 'PUBLIC ' + '"' + doctype.publicId + '"' : ''} ${
        doctype.systemId ? '"' + doctype.systemId + '"' : ''
    }><html><head></head><body></body></html>`
    contentDocument.write(doc)
}

export function injectIframeContent(contentDocument: Document, snapshotData: SnapshotRecord['data']) {
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

// waiting for mouse or scroll transform animation finish
async function actionDelay() {
    return delay(200)
}

function renderCanvas(canvasRecordData: CanvasRecordData) {
    const data = canvasRecordData as UnionToIntersection<CanvasRecordData>
    const { src, status, id, strokes } = data
    const canvas = nodeStore.getNode(id) as HTMLCanvasElement
    if (!canvas) {
        return
    }
    const ctx = canvas.getContext('2d')!
    if (src) {
        const image = new Image()
        image.src = src
        image.onload = function (this: HTMLImageElement) {
            ctx.drawImage(this, 0, 0)
        }
    } else if (status) {
        Object.keys(status).forEach(key => {
            ;(ctx as any)[key] = status[key]
        })
    } else {
        // TODO expect stroke smooth (elapsed time)
        for (const stroke of strokes) {
            // await delay(0) // have problem here
            const { name, args } = stroke
            if (Array.isArray(args)) {
                if (name === 'drawImage' || name === 'createPattern') {
                    args[0] = nodeStore.getNode(args[0])
                }
                ;(ctx[name] as Function).apply(ctx, args)
            } else {
                ;(ctx[name] as Object) = args
            }
        }
    }
}
