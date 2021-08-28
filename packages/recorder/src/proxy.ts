import { isNativeFunction } from '@timecat/utils'
import { Watcher } from './watcher'

const listeners: Array<(element: HTMLElement) => void> = []

function proxyCreateElement(this: Watcher<any>, callback: (element: HTMLElement) => void) {
    listeners.push(callback)
    const originalCreateElement = document.createElement

    if (!isNativeFunction(originalCreateElement)) {
        return
    }

    this.uninstall(() => {
        document.createElement = originalCreateElement
    })

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

export function proxyCreateCanvasElement(this: Watcher<any>, callback: (canvas: HTMLCanvasElement) => void) {
    const fn = (element: HTMLCanvasElement) => {
        if (element.tagName === 'CANVAS') {
            callback(element as HTMLCanvasElement)
        }
    }
    proxyCreateElement.call(this, fn)
}

export function removeProxies() {
    listeners.length = 0
}
