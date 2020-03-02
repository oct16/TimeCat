import { VNode } from './types'

let id = 1
const getId = () => id++

const getVNodeByEl = (el: Element, isSVG?: boolean): VNode => {
    const tagName = el.tagName.toLocaleLowerCase().trim()
    return {
        id: getId(),
        attrs: getAttr(el.attributes),
        tag: tagName,
        children: [] as VNode[],
        extra: { isSVG: isSVG || tagName === 'svg' }
    }
}

const getAttr = (attrs: NamedNodeMap) => {
    if (attrs && attrs.length) {
        return Object.values(attrs).reduce((ret: any, attr) => {
            const [name, value] = extraAttr(attr)
            ret[name] = value
            return ret
        }, {})
    }
}

const extraAttr = (attr: Attr) => {
    let { name, value } = attr
    if (name === 'href' || name === 'src') {
        if (/^\/(?!\/)/.test(value)) {
            const host = `https://github.com`
            value = host + value
        }
    }
    return [name, value]
}

const createElement = (el: Element, inheritSVG?: boolean): any => {
    const vNode = getVNodeByEl(el, inheritSVG)
    inheritSVG = inheritSVG || vNode.extra.isSVG
    el.childNodes.forEach((node: Element) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const child = createElement(node, inheritSVG)
            vNode.children.push(child)
        } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue) {
                const text = trimNodeText(node.nodeValue)
                if (text) {
                    vNode.children.push(text)
                }
            }
        }
    })

    return vNode
}

const trimNodeText = (nodeValue: string) => {
    return nodeValue
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
}

const convertHTML = (doc: Document) => {
    return {
        id: getId(),
        tag: 'HTML',
        attrs: {},
        children: [createElement(doc.head), createElement(doc.body)],
        extra: { isSVG: false }
    }
}

export const virtualDOM = {
    createElement,
    convertHTML
}
