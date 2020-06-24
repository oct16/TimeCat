import { Recorder } from './audio-recorder'
import { AudioRecord, RecordType } from '@timecat/share'
import { getTime, listenerStore } from '@timecat/utils'

export function recordAudio(emitter: (data: AudioRecord) => void) {
    const recorder = new Recorder({
        sampleBits: 8,
        sampleRate: 8000,
        channelCount: 1
    })

    recorder.start()

    listenerStore.add(() => {
        recorder.stop()
    })

    emitter({
        type: RecordType.AUDIO,
        data: {
            type: 'opts',
            data: recorder.getOptions()
        },
        time: getTime().toString()
    })

    recorder.onProgress = audioBase64Data => {
        emitter({
            type: RecordType.AUDIO,
            data: {
                type: 'base64',
                data: audioBase64Data
            },
            time: getTime().toString()
        })
    }
}
