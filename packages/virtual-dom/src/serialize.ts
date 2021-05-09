/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VNode, VSNode } from '@timecat/share'
import { nodeStore, isElementNode, completeCssHref } from '@timecat/utils'

export const getVNode = (el: Node, opts: { isSVG?: boolean; id?: number } = {}): VNode | VSNode => {
    return isElementNode(el)
        ? {
              id: opts.id || nodeStore.createNodeId(),
              type: el.nodeType,
              attrs: getAttr(el as HTMLElement & { checked: boolean }),
              tag: (el as Element).tagName.toLocaleLowerCase(),
              children: [] as VNode[],
              extra: getExtra(el as Element, opts.isSVG)
          }
        : {
              id: opts.id || nodeStore.createNodeId(),
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
    } else if (tagName === 'INPUT') {
        const { checked, value } = node as HTMLInputElement
        if (value !== undefined) {
            props.value = value
        }
        if (checked !== undefined) {
            props.checked = checked
        }
    } else if (tagName === 'OPTION') {
        const { selected } = node as HTMLOptionElement
        if (selected === true) {
            props.selected = true
        }
    } else if (tagName === 'STYLE') {
        const rules = (node as HTMLStyleElement)?.sheet?.rules
        if (rules && rules.length) {
            const cssTexts = Array.from(rules)
                .map(rule => rule.cssText)
                .join(' ')
            props.textContent = completeCssHref(cssTexts)
        }
    } else if (tagName === 'VIDEO') {
        props.autoplay = false
        props.controls = false
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
    const vNode = getVNode(el, { isSVG })
    const { id } = vNode
    nodeStore.addNode(el, id)
    return vNode
}

export const createElement = (el: Node, inheritSVG?: boolean): VNode | VSNode | null => {
    const vNode = getVNode(el, { isSVG: inheritSVG })
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
