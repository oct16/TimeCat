export function setAttribute(node: HTMLElement, name: string, value: string | boolean): void {
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

    if (/^on\w+$/.test(name)) {
        return
    }

    return node.setAttribute(name, value === true ? '' : String(value))
}
