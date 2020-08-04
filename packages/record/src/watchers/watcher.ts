import { WatcherOptions, RecordEvent } from '@timecat/share'
import { registerEvent, emitterHook as EH } from '@timecat/utils'

export class Watcher<T extends RecordData | SnapshotData> {
    context: Window
    emit: RecordEvent<T>
    options: WatcherOptions<T>

    constructor(options: WatcherOptions<T>) {
        const { emit, context } = options
        this.options = options
        this.context = context
        this.emit = emit
    }

    registerEvent = registerEvent

    emitterHook(data: RecordData | SnapshotData) {
        return EH(this.emit, data)
    }
}
