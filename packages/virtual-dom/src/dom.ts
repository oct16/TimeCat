import { completionAttrHref, completionCssHref } from '@WebReplay/utils'

export function setAttribute(node: HTMLElement, name: string, value: string | boolean | null): void {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return
    }
    if (name === 'style') {
        if (typeof value === 'string') {
            node.style.cssText = completionCssHref(value)
        } else if (value !== null && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                node.style[k as any] = v as any
            }
        }
        return
    }

    // for disabled js prefetch
    if (value && typeof value === 'string' && /\.js$/.test(value)) {
        return
    }

    if (!/^[\w\-\d]+$/.test(name)) {
        return
    }

    if (/^on\w+$/.test(name)) {
        return
    }

    if (value === null) {
        return node.removeAttribute(name)
    }

    value = String(value)

    if (name === 'background' || name === 'src' || name === 'href') {
        value = completionAttrHref(String(value))
    }

    if (value.startsWith('/')) {
        value = completionAttrHref(value)
    }

    return node.setAttribute(name, value)
}
