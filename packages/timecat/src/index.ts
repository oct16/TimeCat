import { Recorder, RecorderModule } from '@timecat/recorder'
import { Player, PlayerModule } from '@timecat/player'

export {
    RecordData,
    DBRecordData,
    BaseRecord,
    RecordType,
    AudioOptionsData,
    ReplayOptions,
    ReplayData,
    ReplayHead,
    ReplayPack
} from '@timecat/share'

const version = '__VERSION__'
export { version }

export { Player, PlayerModule, Recorder, RecorderModule }
export { exportReplay, transRecordsToPacks, delay, debounce, throttle } from '@timecat/utils'
