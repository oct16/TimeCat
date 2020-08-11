import { Watcher } from './watcher'
import { SnapshotRecord, WatcherOptions } from '@timecat/share'
import { snapshots } from '@timecat/snapshot'

export class Snapshot extends Watcher<SnapshotRecord> {
    constructor(options: WatcherOptions<SnapshotRecord>) {
        super(options)
        this.init()
    }

    init() {
        const { DOMSnapshot } = snapshots
        const snapshot = DOMSnapshot(this.options.context || window)
        this.emitterHook(snapshot)
    }
}
