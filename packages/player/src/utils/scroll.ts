// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36

export function disableScrolling(target: Document) {
    const keys = { 37: 1, 38: 1, 39: 1, 40: 1 } as { [key: string]: number }

    function preventDefault(e: Event) {
        e.preventDefault()
    }

    function preventDefaultForScrollKeys(e: Event & { keyCode: string }) {
        if (keys[e.keyCode]) {
            preventDefault(e)
            return false
        }
    }

    // modern Chrome requires { passive: false } when adding event
    let supportsPassive = false
    try {
        target.addEventListener(
            'test' as any,
            () => {},
            Object.defineProperty({}, 'passive', {
                get: function () {
                    supportsPassive = true
                }
            })
        )
    } catch (e) {}

    const wheelOpt = supportsPassive ? ({ passive: false } as EventListenerOptions) : false
    const wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel'

    // call this to Disable
    function disableScroll() {
        target.addEventListener('DOMMouseScroll', preventDefault, false) // older FF
        target.addEventListener(wheelEvent, preventDefault, wheelOpt) // modern desktop
        target.addEventListener('touchmove', preventDefault, wheelOpt) // mobile
        target.addEventListener('keydown', preventDefaultForScrollKeys, false)
    }

    // call this to Enable
    // function enableScroll() {
    //     target.removeEventListener('DOMMouseScroll', preventDefault, false)
    //     target.removeEventListener(wheelEvent as any, preventDefault, wheelOpt)
    //     target.removeEventListener('touchmove', preventDefault, wheelOpt)
    //     target.removeEventListener('keydown', preventDefaultForScrollKeys, false)
    // }

    disableScroll()
}
