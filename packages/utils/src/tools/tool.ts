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
    const p = Object.keys(x)
    return (
        Object.keys(y).every(function (i) {
            return p.indexOf(i) !== -1
        }) &&
        p.every(function (i) {
            return objectEquals(x[i], y[i])
        })
    )
}

export function throttle(
    func: Function,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = { leading: false, trailing: false }
): any {
    let context: any
    let args: any
    let result: any
    let timeout: any = null
    let previous = 0

    const later = function () {
        previous = options.leading === false ? 0 : Date.now()
        timeout = null
        result = func.apply(context, args)
        if (!timeout) context = args = null
    }
    return function (this: any) {
        const now = Date.now()
        if (!previous && options.leading === false) previous = now
        const remaining = wait - (now - previous)
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

type Procedure = (...args: any[]) => void

type Options = {
    isImmediate?: boolean
}

export function debounce<F extends Procedure>(
    func: F,
    waitMilliseconds: number,
    options: Options = {
        isImmediate: false
    }
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        const context = this

        const doLater = function () {
            timeoutId = undefined
            if (!options.isImmediate) {
                func.apply(context, args)
            }
        }

        const shouldCallNow = options.isImmediate && timeoutId === undefined

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(doLater, waitMilliseconds)

        if (shouldCallNow) {
            func.apply(context, args)
        }
    }
}
