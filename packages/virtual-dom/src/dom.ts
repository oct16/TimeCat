const DomEventAttrMap = new Set(
    [
        'abort',
        'afterprint',
        'animationend',
        'animationiteration',
        'animationstart',
        'beforeprint',
        'beforeunload',
        'blur',
        'canplay',
        'canplaythrough',
        'change',
        'click',
        'contextmenu',
        'copy',
        'cut',
        'dblclick',
        'drag',
        'dragend',
        'dragenter',
        'dragleave',
        'dragover',
        'dragstart',
        'drop',
        'durationchange',
        'ended',
        'error',
        'focus',
        'focusin',
        'focusout',
        'fullscreenchange',
        'fullscreenerror',
        'hashchange',
        'input',
        'invalid',
        'keydown',
        'keypress',
        'keyup',
        'load',
        'loadeddata',
        'loadedmetadata',
        'loadstart',
        'message',
        'mousedown',
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseover',
        'mouseout',
        'mouseup',
        'offline',
        'online',
        'open',
        'pagehide',
        'pageshow',
        'paste',
        'pause',
        'play',
        'playing',
        'progress',
        'ratechange',
        'resize',
        'reset',
        'scroll',
        'search',
        'seeked',
        'seeking',
        'select',
        'show',
        'stalled',
        'submit',
        'suspend',
        'timeupdate',
        'toggle',
        'touchcancel',
        'touchend',
        'touchmove',
        'touchstart',
        'transitionend',
        'unload',
        'volumechange',
        'waiting',
        'wheel'
    ].map(item => 'on' + item)
)

/**
 *
 * There are three types of methods for setting attribute
 */
export function setAttribute(node: HTMLElement, name: string, value: string | boolean): void {
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

    if (DomEventAttrMap.has(name)) {
        return
    }

    return node.setAttribute(name, value === true ? '' : String(value))
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
