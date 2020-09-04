import { WatcherOptions, TerminateRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class TerminateWatcher extends Watcher<TerminateRecord> {
    constructor(options: WatcherOptions<TerminateRecord>) {
        super(options)
        this.init()
    }

    init() {
        this.context.addEventListener('beforeunload', this.handleFn)

        this.uninstall(() => {
            this.context.removeEventListener('beforeunload', this.handleFn)
        })
    }

    handleFn() {
        // do some sync job
        // navigator.sendBeacon(url, data)
        // this.emitData(this.wrapData())
    }

    wrapData() {
        return [RecordType.TERMINATE, null]
    }
}
