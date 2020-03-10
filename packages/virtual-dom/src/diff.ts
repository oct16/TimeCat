import { VNode } from './types'
import { replaceNode, setAttribute } from './dom'
import { nodeStore } from '@WebReplay/snapshot'

/**
 *
 * Diff self and all children
 *
 */
export function diffNode(vNode: VNode | string | null, node: Element | null): Element | null {
    if (vNode === null || vNode === undefined) {
        return null
    }
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return diffText(vNode, node)
    }
    const output = createNode(vNode)
    if ((vNode.children && vNode.children.length) || (output.childNodes && output.childNodes.length)) {
        diffTree(vNode, output)
    }
    diffAttributes(vNode, output)
    return output
}

/**
 *
 * Diff all child nodes by recursive
 * Update dom in the final
 *
 */
function diffTree(vNode: VNode, node: Element): void {
    const nodeChildren: Element[] = []
    const vNodeChildren = vNode.children.slice()
    vNodeChildren.forEach(vChild => {
        let child = nodeChildren.pop() as Element | null
        child = diffNode(vChild, child)
        if (child) {
            node.appendChild(child)
        }
    })
}

function diffAttributes(vNode: VNode, node: Element): void {
    const attrs = vNode.attrs
    for (const [name, val] of Object.entries(attrs)) {
        setAttribute(node as HTMLElement, name, val)
    }
}

/**
 *
 * create a node by vNode and copy children
 *
 */
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

/**
 *
 * NodeType: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 *
 */
function diffText(textNode: string, node: Element | null | null): Element | null {
    let output: Element | Node
    // node is plain text
    if (node && node.nodeType === Node.TEXT_NODE) {
        // when text value is difference, replace
        if (node.textContent !== String(textNode)) {
            node.textContent = textNode
        }
        output = node
    } else {
        // hard replace node
        output = document.createTextNode(textNode)
        replaceNode(node, output)
    }
    return output as Element
}
