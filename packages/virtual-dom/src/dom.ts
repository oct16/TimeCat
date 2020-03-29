import { completionAttrHref } from '@WebReplay/utils'

export function setAttribute(node: HTMLElement, name: string, value: string | boolean | null): void {
    if (name === 'style') {
        if (value) {
            if (typeof value === 'string') {
                node.style.cssText = value
            } else if (value !== null && typeof value === 'object') {
                for (const [k, v] of Object.entries(value)) {
                    node.style[k as any] = v as any
                }
            }
        }
        return
    }

    if (name === 'background') {
        value = completionAttrHref(String(value))
    }

    if (/^on\w+$/.test(name)) {
        return
    }
    if (!/[\w\d]+/.test(name)) {
        return
    }

    if (value === null) {
        return node.removeAttribute(name)
    }

    return node.setAttribute(name, value === true ? '' : String(value))
}
