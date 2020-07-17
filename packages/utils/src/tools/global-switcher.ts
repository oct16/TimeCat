class GlobalSwitcher {
    // switch property add in here
    keys = [
        'addEventListener',
        'removeEventListener',
        'innerWidth',
        'innerHeight',
        'pageXOffset',
        'pageYOffset',
        'scrollTop',
        'scrollLeft'
    ]

    switch(global: Window) {
        this.keys.forEach(key => {
            if (global === window.top) {
                const original = Object.getOwnPropertyDescriptor(window, key)
                if (original) {
                    Object.defineProperty(window, key, original)
                }
                return
            }

            Object.defineProperty(window, key, {
                get: () => global[key as keyof Window]
            })
        })

        // Compatible with some properties e.g. document, location ... that can't redefine (configurable = false)
        window.currentWindow = global
    }

    default() {
        this.switch(window)
    }

    getDocument() {
        return window.currentWindow.document
    }

    getWindow(name?: keyof Window | string) {
        if (name) {
            const props = (name as string).split('.')

            if (props.length > 1) {
                let target: Window | any = window.currentWindow
                let key
                while ((key = props.shift())) {
                    target = target[key as string]
                }
                return target
            }
            return window.currentWindow[name as keyof Window]
        }

        return window.currentWindow
    }
}

export const GS = new GlobalSwitcher()
