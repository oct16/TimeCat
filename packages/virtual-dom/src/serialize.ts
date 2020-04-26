import { VNode } from './types'
import { nodeStore, completionCssHref, createCommentText } from '@WebReplay/utils'

const getVNodeByEl = (el: Element, isSVG?: boolean): VNode => {
    return {
        id: nodeStore.createNodeId(),
        attrs: getAttr(el as HTMLElement & { checked: boolean }),
        tag: el.tagName.toLocaleLowerCase(),
        children: [] as VNode[],
        extra: getExtra(el, isSVG)
    }
}

const getAttr = (el: HTMLElement & { checked: boolean }) => {
    const resAttr: { [key: string]: string } = {}
    const attrs = el.attributes
    if (attrs && attrs.length) {
        return Object.values(attrs).reduce((ret: { [key: string]: string }, attr) => {
            const [name, value] = extraAttr(attr)
            if (name) {
                ret[name] = value
            }
            return ret
        }, resAttr)
    }
    return resAttr
}

function getExtra(node: Element, isSVG?: boolean) {
    const { tagName } = node
    const extra: VNode['extra'] = {}
    if (isSVG || tagName === 'SVG') {
        extra.isSVG = true
    }
    if (tagName === 'INPUT') {
        const props: VNode['extra']['props'] = {}
        const { checked, value } = node as any
        if (value !== undefined) {
            props.value = value
        }
        if (checked !== undefined) {
            props.checked = checked
        }
        if (Object.keys(props).length) {
            extra.props = props
        }
    }
    return extra
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
            let data = node.nodeValue!
            const comment = createCommentText(data)
            vNode.children.push(comment)
        }
    })
    return vNode
}

export const virtualDOM = {
    createElement
}
