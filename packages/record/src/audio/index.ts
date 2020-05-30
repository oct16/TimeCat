import { Recorder } from './audio-recorder'
import { AudioWatcher, RecordType } from '../types'
import { getTime, listenerStore } from '@TimeCat/utils'

export function recordAudio(emitter: (data: AudioWatcher) => void) {
    const recorder = new Recorder({
        bufferSize: 256 // min of range
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
