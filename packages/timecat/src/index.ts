import { Recorder, RecorderModule } from '@timecat/recorder'
import { exportReplay, Player, PlayerModule } from '@timecat/player'

export {
    RecordData,
    DBRecordData,
    BaseRecord,
    RecordType,
    AudioOptionsData,
    ReplayOptions,
    ReplayData,
    ReplayHead
} from '@timecat/share'

const version = '__VERSION__'
export { version }

export { Player, PlayerModule, Recorder, RecorderModule, exportReplay }
export { delay, debounce, throttle } from '@timecat/utils'
