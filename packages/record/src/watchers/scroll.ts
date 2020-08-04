import { getTime, nodeStore } from '@timecat/utils'
import { WatcherOptions, ScrollRecord, RecordType } from '@timecat/share'
import { Watcher } from './watcher'

export class ScrollWatcher extends Watcher<ScrollRecord> {
    constructor(options: WatcherOptions<ScrollRecord>) {
        super(options)
        this.init()
    }

    getCompatibleTarget = (target: Document) => (target.scrollingElement as HTMLElement) || target.documentElement
    scrollTop = (target: HTMLElement) => target.scrollTop
    scrollLeft = (target: HTMLElement) => target.scrollLeft

    init() {
        const { scrollingElement } = this.context.document
        this.emitData(scrollingElement || document)
        const context = this.context
        const handleFn = this.handleFn
        this.registerEvent({
            context,
            eventTypes: ['scroll'],
            handleFn,
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { leading: true, trailing: true },
            waitTime: 300
        })
    }

    emitData(target: Element | Document) {
        const element = target instanceof HTMLElement ? target : this.getCompatibleTarget(target as Document)

        this.emitterHook({
            type: RecordType.SCROLL,
            data: {
                id: nodeStore.getNodeId(element) || null, // if null, target is document
                top: this.scrollTop(element),
                left: this.scrollLeft(element)
            },
            time: getTime().toString()
        })
    }

    handleFn(e: Event) {
        const { type, target } = e
        if (type === 'scroll') {
            this.emitData(target as Element | Document)
        }
    }
}
