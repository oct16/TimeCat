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

    const output = !node || !isSameNodeType(vNode, node) ? createNode(vNode, node) : node

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
    const nodeChildren = node ? (Array.from(node.childNodes).slice() as Element[]) : []
    const vNodeChildren = vNode.children.slice()
    vNodeChildren.forEach(vChild => {
        let child: Element | null = null
        for (const [i, subNode] of nodeChildren.entries()) {
            if (isSameNodeType(vChild, subNode)) {
                ;[child] = nodeChildren.splice(i, 1)
                break
            }
        }

        const oldChild = child
        child = diffNode(vChild, child)
        if (child) {
            updateDom(node, oldChild, child)
        }
    })
}

/**
 *
 * The func for update document after diff was completed
 *
 */
function updateDom(node: Element, oldChild: Element | null, newChild: Element): void {
    if (newChild && newChild !== node && newChild !== oldChild) {
        if (!oldChild) {
            node.appendChild(newChild)
            return
        }

        if (newChild === oldChild.nextSibling) {
            replaceNode(oldChild)
            return
        }

        node.insertBefore(newChild, oldChild)
    }
}

/**
 *
 * Diff attrs value
 * update dom by new value
 *
 */
function diffAttributes(vNode: VNode, node: Element): void {
    const cachedAttrs = new Map()
    const attrs = vNode.attrs

    for (const attr of node.attributes) {
        cachedAttrs.set(attr.name, attr.value)
    }

    if (attrs) {
        for (const [name, val] of Object.entries(attrs)) {
            const oldVal = cachedAttrs.get(name)
            if (oldVal !== val) {
                setAttribute(node as HTMLElement, name, val)
            }
        }
    }
}

/**
 *
 * create a node by vNode and copy children
 *
 */
function createNode(vNode: VNode, node: Element | null): Element {
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

    if (node) {
        const childNodes = Array.from(node.childNodes)
        childNodes.forEach(childNode => output.appendChild(childNode))
        replaceNode(node, output)
    }
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
 * Compare virtual node and real node whether the same type or not
 *
 */
function isSameNodeType(vNode: VNode | string, node: Element | null): boolean {
    if (!node) {
        return false
    }

    // still plain text node
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return node.nodeType === Node.TEXT_NODE
    }

    // element node type
    if (typeof vNode.tag === 'string') {
        return node.nodeName.toLowerCase() === vNode.tag.toLowerCase() && node.nodeType === Node.ELEMENT_NODE
    }

    return false
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

/**
 *
 * For bootstrap step
 *
 */
export default function diff(vNode: VNode, node: Element): Element | null {
    if (!vNode) {
        return null
    }
    const output = diffNode(vNode, node)

    return output
}
