import { setAttribute } from './dom'
import { nodeStore, isDev, isCommentStr, isHideComment } from '@WebReplay/utils'
import { VNode } from './types'

export function convertVNode(vNode: VNode | string | null, node: Element | null): Element | null {
    if (vNode === null || vNode === undefined) {
        return null
    }
    if (typeof vNode === 'string') {
        if (isCommentStr(vNode)) {
            return createCommentByCommentStr(vNode)
        }
        return createText(vNode, node)
    }
    const output = createNode(vNode)
    if ((vNode.children && vNode.children.length) || (output.childNodes && output.childNodes.length)) {
        travel(vNode, output)
    }
    createAttributes(vNode, output)
    createProps(vNode, output)
    return output
}

function travel(vNode: VNode, node: Element): void {
    const nodeChildren: Element[] = []
    const vNodeChildren = vNode.children.slice()
    vNodeChildren.forEach(vChild => {
        let child = nodeChildren.pop() as Element | null
        child = convertVNode(vChild, child)
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

function createNode(vNode: VNode): Element {
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

function createText(textNode: string, node: Element | null | null): Element | null {
    let output: Element | Node
    output = document.createTextNode(textNode)
    return output as Element
}

function createCommentByCommentStr(text: string) {
    let output: Element | Node
    output = document.createComment(text.substring(4, text.length - 3))
    return output as Element
}
