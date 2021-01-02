/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
