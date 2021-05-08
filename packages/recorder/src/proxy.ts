import { isNativeFunction } from '@timecat/utils'

const listeners: Array<(element: HTMLElement) => void> = []

function proxyCreateElement(callback: (element: HTMLElement) => void) {
    listeners.push(callback)
    const originalCreateElement = document.createElement

    if (!isNativeFunction(originalCreateElement)) {
        return
    }

    document.createElement = function (
        this: Document,
        tagName: keyof HTMLElementTagNameMap,
        options?: ElementCreationOptions | false
    ) {
        const ret = originalCreateElement.call(this, tagName, options)
        if (options !== false) {
            listeners.forEach(listener => listener(ret))
        }
        return ret
    } as typeof originalCreateElement
}

export function proxyCreateCanvasElement(callback: (canvas: HTMLCanvasElement) => void) {
    proxyCreateElement(element => {
        if (element.tagName === 'CANVAS') {
            callback(element as HTMLCanvasElement)
        }
    })
}

export function removeProxies() {
    listeners.length = 0
}
