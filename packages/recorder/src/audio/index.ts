/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AudioRecorder } from './audio-recorder'
import { AudioRecord, RecordType, WatcherArgs } from '@timecat/share'
import { Watcher } from '../watcher'

export class RecordAudio extends Watcher<AudioRecord> {
    constructor(options: WatcherArgs<AudioRecord>) {
        super(options)
        this.init()
    }

    init() {
        const recorder = new AudioRecorder({
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        })

        recorder.start()

        this.uninstall(() => {
            recorder.stop()
        })

        this.emitData(RecordType.AUDIO, {
            type: 'opts',
            data: recorder.getOptions()
        })

        recorder.onProgress = audioBase64Data => {
            this.emitData(RecordType.AUDIO, {
                type: 'base64',
                data: audioBase64Data
            })
        }
    }
}
