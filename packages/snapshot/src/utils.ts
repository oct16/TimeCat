export function debounce(fn: Function, wait: number) {
    if (!fn || !wait) {
        throw Error('lack of arguments')
    }
    var timer: number
    return function(this: any) {
        var self = this
        var args = arguments
        clearTimeout(timer)
        timer = setTimeout(function() {
            fn.apply(self, args)
        }, wait)
    }
}

export function throttle(fn: Function, wait: number) {
    if (!fn || !wait) {
        throw Error('lack of arguments')
    }

    var getTimer = function() {
        return wait + Date.now()
    }
    var timer = getTimer()
    return function(this: any) {
        if (Date.now() > timer) {
            fn.apply(this, arguments)
            timer = getTimer()
        }
    }
}
