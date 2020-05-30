import { IRecorderOptions } from '../types'

export function encodeWAV(data: Float32Array[], opts: IRecorderOptions) {
    const arrayBuffer = createWavFile(mergeArray(data), opts)

    let blob = new Blob([new Uint8Array(arrayBuffer)], {
        type: 'audio/wav'
    })

    return blob
}

function mergeArray(list: Float32Array[]) {
    let length = list.length * list[0].length
    let data = new Float32Array(length),
        offset = 0
    for (let i = 0; i < list.length; i++) {
        data.set(list[i], offset)
        offset += list[i].length
    }
    return data
}

function createWavFile(audioData: Float32Array, { channelCount }: IRecorderOptions) {
    const WAV_HEAD_SIZE = 44
    let buffer = new ArrayBuffer(audioData.length * 2 + WAV_HEAD_SIZE)
    // control buffer
    const view = new DataView(buffer)
    // write head
    // RIFF chunk descriptor/identifier
    writeUTFBytes(view, 0, 'RIFF')
    // RIFF chunk length
    view.setUint32(4, 44 + audioData.length * 2, true)
    // RIFF type
    writeUTFBytes(view, 8, 'WAVE')
    // format chunk identifier
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ')
    // format chunk length
    view.setUint32(16, 16, true)
    // sample format (raw)
    view.setUint16(20, 1, true)
    // stereo (2 channels)
    view.setUint16(22, channelCount as number, true)
    // sample rate
    view.setUint32(24, 44100, true)
    // byte rate (sample rate * block align)
    view.setUint32(28, 44100 * 2, true)
    // block align (channel count * bytes per sample)
    view.setUint16(32, (channelCount as number) * 2, true)
    // bits per sample
    view.setUint16(34, 16, true)
    // data sub-chunk
    // data chunk identifier
    writeUTFBytes(view, 36, 'data')
    // data chunk length
    view.setUint32(40, audioData.length * 2, true)

    // write PCM
    let length = audioData.length
    let index = 44
    let volume = 1
    for (let i = 0; i < length; i++) {
        view.setInt16(index, audioData[i] * (0x7fff * volume), true)
        index += 2
    }
    return buffer
}

function writeUTFBytes(view: DataView, offset: number, string: string) {
    var lng = string.length
    for (var i = 0; i < lng; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

export function float32ArrayToBase64(float32Array: Float32Array) {
    // Convert F32 to Uint8
    const uint = new Uint8Array(float32Array.buffer)
    // Convert Uint8 to Base64
    const str = btoa(String.fromCharCode.apply(null, uint))
    return str
}

export function base64ToFloat32Array(str: string) {
    const blob = atob(str)
    const bLength = blob.length
    const arrayBuffer = new ArrayBuffer(bLength)
    const dataView = new DataView(arrayBuffer)
    for (let i = 0; i < bLength; i++) {
        dataView.setUint8(i, blob.charCodeAt(i))
    }

    return new Float32Array(arrayBuffer)
}
