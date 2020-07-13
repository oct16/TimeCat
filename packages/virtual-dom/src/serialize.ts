import { VNode, VSNode } from '@timecat/share'
import { nodeStore, isElementNode } from '@timecat/utils'

const getVNodeByEl = (el: Element, isSVG?: boolean): VNode | VSNode => {
    if (isElementNode(el)) {
        return {
            id: nodeStore.createNodeId(),
            type: el.nodeType,
            attrs: getAttr(el as HTMLElement & { checked: boolean }),
            tag: el.tagName.toLocaleLowerCase(),
            children: [] as VNode[],
            extra: getExtra(el, isSVG)
        }
    } else {
        return {
            id: nodeStore.createNodeId(),
            type: el.nodeType,
            value: el.textContent as string
        }
    }
}

const getAttr = (el: HTMLElement & { checked: boolean }) => {
    const resAttr: { [key: string]: string } = {}
    const { attributes } = el
    if (attributes && attributes.length) {
        return Object.values(attributes).reduce((ret: { [key: string]: string }, attr) => {
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
    if (isSVG || tagName.toLowerCase() === 'svg') {
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
    return [name, value]
}

export const createFlatVNode = (el: Element, isSVG = false) => {
    const vNode = getVNodeByEl(el, isSVG)
    const { id } = vNode
    nodeStore.addNode(el, id)
    return vNode
}

export const createElement = (el: Element, inheritSVG?: boolean): VNode | VSNode | null => {
    const vNode = getVNodeByEl(el, inheritSVG)
    const { id } = vNode
    nodeStore.addNode(el, id)

    if (vNode.type === Node.ELEMENT_NODE) {
        const vn = vNode as VNode
        inheritSVG = inheritSVG || vn.extra.isSVG
        el.childNodes.forEach((node: Element) => {
            const child = createElement(node, inheritSVG)
            if (child) {
                vn.children.push(child)
            }
        })
    }

    return vNode
}

export const virtualDOM = {
    createElement
}
