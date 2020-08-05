import { Recorder } from './audio-recorder'
import { AudioRecord, RecordType, WatcherOptions } from '@timecat/share'
import { getTime, uninstallStore } from '@timecat/utils'
import { Watcher } from '../watchers/watcher'

export class RecordAudio extends Watcher<AudioRecord> {
    constructor(options: WatcherOptions<AudioRecord>) {
        super(options)
        this.init()
    }

    init() {
        const recorder = new Recorder({
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        })

        recorder.start()

        uninstallStore.add(() => {
            recorder.stop()
        })

        this.emitterHook({
            type: RecordType.AUDIO,
            data: {
                type: 'opts',
                data: recorder.getOptions()
            },
            time: getTime().toString()
        })

        recorder.onProgress = audioBase64Data => {
            this.emitterHook({
                type: RecordType.AUDIO,
                data: {
                    type: 'base64',
                    data: audioBase64Data
                },
                time: getTime().toString()
            })
        }
    }
}
