import { Recorder, RecordData, RecorderModule } from '@timecat/recorder'
import { exportReplay, createReplayHTML, Player, PlayerModule } from '@timecat/player'

export {
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

export { Player, PlayerModule, Recorder, RecordData, RecorderModule, exportReplay, createReplayHTML }
export { delay, debounce, throttle } from '@timecat/utils'
