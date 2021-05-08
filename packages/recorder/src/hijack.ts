import { isNativeFunction } from '@timecat/utils'

const listeners: Array<(element: HTMLElement) => void> = []

function hijackCreateElement(callback: (element: HTMLElement) => void) {
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

export function hijackCreateCanvasElement(callback: (canvas: HTMLCanvasElement) => void) {
    hijackCreateElement(element => {
        if (element.tagName === 'CANVAS') {
            callback(element as HTMLCanvasElement)
        }
    })
}

export function removeHijacks() {
    listeners.length = 0
}
