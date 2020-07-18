import { Recorder } from './audio-recorder'
import { AudioRecord, RecordType, WatcherOptions } from '@timecat/share'
import { getTime, listenerStore } from '@timecat/utils'

export function recordAudio(options: WatcherOptions<AudioRecord>) {
    const { emit } = options
    const recorder = new Recorder({
        sampleBits: 8,
        sampleRate: 8000,
        channelCount: 1
    })

    recorder.start()

    listenerStore.add(() => {
        recorder.stop()
    })

    emit({
        type: RecordType.AUDIO,
        data: {
            type: 'opts',
            data: recorder.getOptions()
        },
        time: getTime().toString()
    })

    recorder.onProgress = audioBase64Data => {
        emit({
            type: RecordType.AUDIO,
            data: {
                type: 'base64',
                data: audioBase64Data
            },
            time: getTime().toString()
        })
    }
}
