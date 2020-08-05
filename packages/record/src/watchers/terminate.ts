import { getTime, uninstallStore } from '@timecat/utils'
import { WatcherOptions, TerminateRecord, RecordType } from '@timecat/share'
import { Watcher } from './watcher'

export class TerminateWatcher extends Watcher<TerminateRecord> {
    constructor(options: WatcherOptions<TerminateRecord>) {
        super(options)
        this.init()
    }

    init() {
        this.context.addEventListener('beforeunload', this.handleFn)

        uninstallStore.add(() => {
            this.context.removeEventListener('beforeunload', this.handleFn)
        })
    }

    handleFn(e: Event) {
        // do some sync job
        // navigator.sendBeacon(url, data)
        // this.emitData(...)
    }

    emitData() {
        this.emitterHook({
            type: RecordType.TERMINATE,
            data: null,
            time: getTime().toString()
        })
    }
}
