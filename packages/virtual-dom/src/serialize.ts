import { VNode } from './types'
import { nodeStore, completionCssHref, completionAttrHref, createCommentText } from '@WebReplay/utils'

const getVNodeByEl = (el: Element, isSVG?: boolean): VNode => {
    const tagName = el.tagName.toLocaleLowerCase().trim()
    return {
        id: nodeStore.createNodeId(),
        attrs: getAttr(el as HTMLElement & { checked: boolean }),
        tag: tagName,
        children: [] as VNode[],
        extra: { isSVG: isSVG || tagName === 'svg' }
    }
}

const getAttr = (el: HTMLElement & { checked: boolean }) => {
    const resAttr: { [key: string]: string } = {}
    const attrs = el.attributes
    if (el.checked) {
        resAttr.checked = 'true'
    }

    if (attrs && attrs.length) {
        return Object.values(attrs).reduce((ret: any, attr) => {
            const [name, value] = extraAttr(attr)
            if (name) {
                ret[name] = value
            }
            return ret
        }, resAttr)
    }
    return resAttr
}

const extraAttr = (attr: Attr) => {
    let { name, value } = attr
    if (name === 'href' || name === 'src') {
        if (value.startsWith('#/')) {
            return []
        }
        return [name, value]
    }
    if (name === 'style') {
        return [name, value]
    }
    return [name, value]
}

export const createElement = (el: Element, inheritSVG?: boolean): VNode | null => {
    if (el.nodeType === Node.TEXT_NODE) {
        return null
    }
    // if (el.tagName === 'SCRIPT') {
    //     return null
    // }
    const vNode = getVNodeByEl(el, inheritSVG)
    const { id } = vNode
    nodeStore.addNode(el, id)
    inheritSVG = inheritSVG || vNode.extra.isSVG
    el.childNodes.forEach((node: Element) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const child = createElement(node, inheritSVG)
            if (child) {
                vNode.children.push(child)
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue) {
                let text = node.nodeValue
                if (el.tagName === 'STYLE') {
                    text = completionCssHref(node.nodeValue)
                }
                if (text) {
                    vNode.children.push(text)
                }
            }
        } else if (node.nodeType === Node.COMMENT_NODE) {
            let data = node.nodeValue
            if (data) {
                const comment = createCommentText(data)
                vNode.children.push(comment)
            }
        }
    })
    return vNode
}

const convertHTML = (doc: Document) => {
    const { head, body } = doc
    return {
        id: nodeStore.createNodeId(),
        tag: 'html',
        attrs: {},
        children: [createElement(head), createElement(body)],
        extra: { isSVG: false }
    }
}

export const virtualDOM = {
    createElement,
    convertHTML
}
