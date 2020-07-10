/**
 * Reference: https://developers.google.com/web/tools/lighthouse/audits/first-meaningful-paint
 * TODO FMP (first Meaningful Paint) TODO
 */
class FMP {
    interval = 1000
    len = 0
    resolved = false
    listener: Array<() => void> = []
    timer: null | number = null
    constructor() {
        this.observe()
    }

    private clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
    }

    observe() {
        this.timer = window.setTimeout(() => {
            const entries = performance
                .getEntriesByType('resource')
                .filter((item: PerformanceResourceTiming) => this.isMatchType(item))
            const len = entries.length
            if (len <= this.len) {
                performance.clearResourceTimings()
                this.clearTimer()
                this.resolved = true
                if (this.listener.length) {
                    this.listener.forEach(run => run())
                }
                return
            }
            this.len = len
            this.observe()
        }, this.interval)
    }

    isMatchType(entry: PerformanceResourceTiming) {
        switch (entry.initiatorType) {
            case 'link':
            case 'img':
            case 'css':
            case 'iframe':
                return true
            default:
                break
        }
    }

    ready(fn: () => void) {
        if (this.resolved) {
            return fn()
        }
        this.listener.push(fn)
    }
}

export const fmp = new FMP()
