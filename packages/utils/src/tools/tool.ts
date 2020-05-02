export function objectEquals(x: any, y: any): boolean {
    if (x === null || x === undefined || y === null || y === undefined) {
        return x === y
    }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) {
        return false
    }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) {
        return x === y
    }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) {
        return x === y
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true
    }
    if (Array.isArray(x) && x.length !== y.length) {
        return false
    }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) {
        return false
    }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
        return false
    }
    if (!(y instanceof Object)) {
        return false
    }

    // recursive object equality check
    var p = Object.keys(x)
    return (
        Object.keys(y).every(function(i) {
            return p.indexOf(i) !== -1
        }) &&
        p.every(function(i) {
            return objectEquals(x[i], y[i])
        })
    )
}

export function throttle(
    func: Function,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = { leading: false, trailing: false }
): any {
    var context: any
    var args: any
    var result: any
    var timeout: any = null
    var previous = 0

    var later = function() {
        previous = options.leading === false ? 0 : Date.now()
        timeout = null
        result = func.apply(context, args)
        if (!timeout) context = args = null
    }
    return function(this: any) {
        var now = Date.now()
        if (!previous && options.leading === false) previous = now
        var remaining = wait - (now - previous)
        context = this
        args = arguments
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            }
            previous = now
            result = func.apply(context, args)
            if (!timeout) context = args = null
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining)
        }
        return result
    }
}
