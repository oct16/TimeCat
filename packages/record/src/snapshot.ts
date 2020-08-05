import { Watcher } from './watchers/watcher'
import { SnapshotData, WatcherOptions } from '@timecat/share'
import { snapshots } from '@timecat/snapshot'

export class Snapshot extends Watcher<SnapshotData> {
    constructor(options: WatcherOptions<SnapshotData>) {
        super(options)
        this.init()
    }

    init() {
        const { DOMSnapshot } = snapshots
        const snapshot = DOMSnapshot(this.options.context || window)
        this.emitterHook(snapshot)
    }
}
