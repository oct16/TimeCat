import { Recorder } from '@timecat/recorder'
import { Player } from '@timecat/player'

export {
    RecordData,
    DBRecordData,
    BaseRecord,
    RecordType,
    RecorderOptions,
    ReplayOptions,
    ReplayData,
    ReplayHead,
    ReplayPack
} from '@timecat/share'

const version = '__VERSION__'
export { version }

export { Player, Recorder }
export { exportReplay, classifyRecords, delay, debounce, throttle } from '@timecat/utils'
