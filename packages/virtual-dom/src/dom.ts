/**
 *
 * There are three types of methods for setting attribute
 */
export function setAttribute(node: HTMLElement, name: string, value: string | boolean): void {
    // // If it starts with a world "on", we consider this attribute to be a method
    // if (/^on[A-Z]\w+$/.test(name)) {
    //     name = name.toLowerCase()
    //     node.setAttribute(name, value.toString() || '')
    //     return
    // }

    // If it is a style syntax
    // Set a type string css or a object
    if (name === 'style') {
        if (value) {
            if (typeof value === 'string') {
                node.style.cssText = value
            } else if (value !== null && typeof value === 'object') {
                for (const [k, v] of Object.entries(value)) {
                    // @ts-ignore
                    node.style[k] = v as any
                }
            }
        }
        return
    }

    if (value === true) {
        return node.setAttribute(name, '')
    }
    return node.setAttribute(name, String(value) || '')
}

/**
 *
 * Remove or Replace a node
 *
 */
export function replaceNode(node: Node | null, newNode?: Node): void {
    if (node && node.parentNode) {
        if (newNode) {
            node.parentNode.replaceChild(newNode, node)
        } else {
            node.parentNode.removeChild(node)
        }
    }
}
