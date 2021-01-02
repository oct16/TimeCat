/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VNode, VSNode } from '@timecat/share'
import { nodeStore, isElementNode } from '@timecat/utils'

const getVNodeByEl = (el: Element, isSVG?: boolean): VNode | VSNode => {
    return isElementNode(el)
        ? {
              id: nodeStore.createNodeId(),
              type: el.nodeType,
              attrs: getAttr(el as HTMLElement & { checked: boolean }),
              tag: el.tagName.toLocaleLowerCase(),
              children: [] as VNode[],
              extra: getExtra(el, isSVG)
          }
        : {
              id: nodeStore.createNodeId(),
              type: el.nodeType,
              value: el.textContent as string
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
    const extra = {} as VNode['extra']
    const props = {} as VNode['extra']['props']

    if (isSVG || tagName.toLowerCase() === 'svg') {
        extra.isSVG = true
    }

    if (tagName === 'INPUT') {
        const { checked, value } = node as HTMLInputElement
        if (value !== undefined) {
            props.value = value
        }
        if (checked !== undefined) {
            props.checked = checked
        }
    }

    if (tagName === 'OPTION') {
        const { selected } = node as HTMLOptionElement
        if (selected === true) {
            props.selected = true
        }
    }

    if (tagName === 'STYLE') {
        const rules = (node as HTMLStyleElement)?.sheet?.rules
        if (rules && rules.length) {
            const cssTexts = Array.from(rules)
                .map(rule => rule.cssText)
                .join(' ')
            props.textContent = cssTexts
        }
    }

    // find the scrolled elements
    const scrollLeft = node.scrollLeft
    const scrollTop = node.scrollTop
    if (scrollTop || scrollLeft) {
        props.scroll = {
            left: scrollLeft,
            top: scrollTop
        }
    }

    if (Object.keys(props).length) {
        extra.props = props
    }

    return extra
}

const extraAttr = (attr: Attr) => {
    const { name, value } = attr
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

    if ((vNode as VNode)?.extra?.props?.textContent) {
        return vNode
    }

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
