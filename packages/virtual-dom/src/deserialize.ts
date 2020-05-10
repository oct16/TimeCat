import { setAttribute } from './dom'
import { nodeStore, isDev, isHideComment, completionCssHref } from '@WebReplay/utils'
import { VNode, VSNode } from './types'

export function convertVNode(vNode: VNode | VSNode | null, parent?: VNode): Element | null {
    if (vNode === null || vNode === undefined) {
        return null
    }
    const vs = vNode as VSNode
    if (vNode.type === Node.COMMENT_NODE) {
        return createCommentNode(vs)
    }
    if (vNode.type === Node.TEXT_NODE) {
        if (parent && parent.tag === 'style') {
            vs.value = completionCssHref(vs.value)
        }
        return createText(vs)
    }
    const vn = vNode as VNode
    const output = createNode(vn)

    if ((vn.children && vn.children.length) || (output.childNodes && output.childNodes.length)) {
        travel(vn, output)
    }

    return output
}

function travel(vNode: VNode, node: Element): void {
    const nodeChildren: Element[] = []
    const vNodeChildren = vNode.children.slice()
    vNodeChildren.forEach(vChild => {
        let child = nodeChildren.pop() as Element | null
        child = convertVNode(vChild, vNode)
        if (child) {
            if (isHideComment(node.lastChild)) {
                setAttribute(child as HTMLElement, 'style', 'visibility: hidden')
            }
            node.appendChild(child)
        }
    })
}

function createProps(vNode: VNode, node: Element): void {
    const { props } = vNode.extra
    if (props) {
        for (let [key, val] of Object.entries(props)) {
            ;(node as any)[key] = val
        }
    }
}

function createAttributes(vNode: VNode, node: Element): void {
    const { attrs } = vNode
    for (const [name, val] of Object.entries(attrs)) {
        setAttribute(node as HTMLElement, name, val)
    }
}

export function createSpecialNode(vsNode: VSNode) {
    const { type, value, id } = vsNode

    let output: Node

    switch (type) {
        case Node.TEXT_NODE:
            output = document.createTextNode(value)
            break
        case Node.COMMENT_NODE:
            output = document.createComment(value)
            break
    }
    nodeStore.updateNode(id, output!)
    return output!
}

export function createNode(vNode: VNode): Element {
    const { id, extra } = vNode
    const { isSVG } = extra
    let output: Element
    const tagName = transformTagName(vNode.tag)
    if (isSVG) {
        output = document.createElementNS('http://www.w3.org/2000/svg', tagName)
    } else {
        output = document.createElement(tagName)
    }

    if (isDev) {
        setAttribute(output as HTMLElement, 'vid', id.toString())
    }
    createAttributes(vNode, output)
    createProps(vNode, output)
    nodeStore.updateNode(id, output)
    return output
}

function transformTagName(tag: string) {
    const tagMap: { [key: string]: string } = {
        script: 'noscript'
    }
    const tagName = tagMap[tag] || tag
    return tagName
}

function createText(vs: VSNode) {
    const { value, id } = vs
    let output: Element | Node
    output = document.createTextNode(value)
    nodeStore.updateNode(id, output)
    return output as Element
}

function createCommentNode(vs: VSNode) {
    const { value, id } = vs
    let output: Element | Node
    output = document.createComment(value)
    nodeStore.updateNode(id, output)
    return output as Element
}
