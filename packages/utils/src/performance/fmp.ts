class FMP {
    interval = 1000
    len = 0
    listener: Array<() => void> = []
    constructor() {
        this.observe()
    }

    observe() {
        setTimeout(() => {
            const entries = performance
                .getEntriesByType('resource')
                .filter((item: PerformanceResourceTiming) => this.isMatchType(item))
            const len = entries.length
            if (len <= this.len) {
                performance.clearResourceTimings()
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
        this.listener.push(fn)
    }
}

export const fmp = new FMP()
