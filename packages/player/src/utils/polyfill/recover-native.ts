// Recovery overridden window and document methods

// TODO Recovery method but does not affect the current function of the page

// Usage like this...
// recovery.recoverMethod('MutationObserver')
// recovery.recoverMethod('HTMLElement.prototype.appendChild')

class RecoverNative {
    private frame: HTMLIFrameElement
    private safeWindow: Window
    constructor() {
        const frame = document.createElement('iframe')!
        frame.style.display = 'none'
        frame.style.visibility = 'hidden'
        document.body.appendChild(frame)
        this.safeWindow = frame.contentWindow!
    }

    private getObjByPath(path: string, target: Window) {
        if (!path) {
            return target
        }

        const pathArray = this.getMethodAtPath(path)

        let method = target
        pathArray.forEach(key => {
            method = (method as any)[key]
        })

        return method as any
    }

    private getMethodAtPath(path: string) {
        return path.split('.')
    }

    public recoverMethod(path: string) {
        const currFn = this.getObjByPath(path, window)
        if (!this.isNative(currFn)) {
            const nativeFn = this.getObjByPath(path, this.safeWindow)
            this.recover(path, nativeFn)
        }
    }

    private recover(path: string, fn: Function) {
        const pathArray = this.getMethodAtPath(path)
        const [methodName, ..._path] = pathArray.reverse()
        const host = this.getObjByPath(_path.reverse().join('.'), window)
        host[methodName] = fn
    }

    /**
     * Check if a method is native
     * https://davidwalsh.name/detect-native-function
     */
    private isNative(value: Function) {
        // Used to resolve the internal `[[Class]]` of values
        const toString = Object.prototype.toString

        // Used to resolve the decompiled source of functions
        const fnToString = Function.prototype.toString

        // Used to detect host constructors (Safari > 4; really typed array specific)
        const reHostCtor = /^\[object .+?Constructor\]$/

        // Compile a regexp using a common native method as a template.
        // We chose `Object#toString` because there's a good chance it is not being mucked with.
        const reNative = RegExp(
            '^' +
                // Coerce `Object#toString` to a string
                String(toString)
                    // Escape any special regexp characters
                    .replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&')
                    // Replace mentions of `toString` with `.*?` to keep the template generic.
                    // Replace thing like `for ...` to support environments like Rhino which add extra info
                    // such as method arity.
                    .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
                '$'
        )
        const type = typeof value
        return type == 'function'
            ? // Use `Function#toString` to bypass the value's own `toString` method
              // and avoid being faked out.
              reNative.test(fnToString.call(value))
            : // Fallback to a host object check because some environments will represent
              // things like typed arrays as DOM methods which may not conform to the
              // normal native pattern.
              (value && type == 'object' && reHostCtor.test(toString.call(value))) || false
    }
}

export const recoverNative = new RecoverNative()

recoverNative.recoverMethod('MutationObserver')
