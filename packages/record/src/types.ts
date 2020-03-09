import { SnapshotData } from '@WebReplay/snapshot'

export interface RecordOptions {
    emitter?: (e: SnapshotData) => void
}
