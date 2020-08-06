import { WatcherOptions, WindowRecord, RecordType } from '@timecat/share'
import { Watcher } from './watcher'

export class WindowWatcher extends Watcher<WindowRecord> {
    constructor(options: WatcherOptions<WindowRecord>) {
        super(options)
        this.init()
    }

    width = () => this.context.innerWidth
    height = () => this.context.innerHeight

    init() {
        this.emitData(this.context.document)
        this.registerEvent({
            context: this.context,
            eventTypes: ['resize'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { trailing: true },
            waitTime: 500
        })
    }

    handleFn(e: Event) {
        const { type, target } = e
        if (type === 'resize') {
            this.emitData(target as Element | Document)
        }
    }

    emitData(target: Element | Document) {
        this.emitterHook({
            type: RecordType.WINDOW,
            data: {
                id: this.getNodeId(target) || null,
                width: this.width(),
                height: this.height()
            },
            time: this.getRadix64TimeStr()
        })
    }
}
