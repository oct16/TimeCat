import { base64ToFloat32Array, encodeWAV, float32ArrayToBase64 } from '@timecat/utils'

describe('Test of transform', () => {
    const str = 'test'
    const asc = btoa(str)
    it('base64ToFloat32Array and base64ToFloat32Array', () => {
        const blob = atob(asc)
        const bLength = blob.length
        const arrayBuffer = new ArrayBuffer(bLength)
        const dataView = new DataView(arrayBuffer)
        for (let i = 0; i < bLength; i++) {
            dataView.setUint8(i, blob.charCodeAt(i))
        }

        const expectedFloat32Array = new Float32Array(arrayBuffer)
        const actualFloat32Array = base64ToFloat32Array(asc)

        expect(actualFloat32Array).toStrictEqual(expectedFloat32Array)

        const uint8Array = new Uint8Array(actualFloat32Array.buffer)
        const baseStr = btoa(String.fromCharCode.apply(null, uint8Array))
        const actualBaseStr = float32ArrayToBase64(actualFloat32Array)
        expect(baseStr).toStrictEqual(actualBaseStr)

        expect(atob(baseStr)).toEqual(str)
    })

    it('encodeWAV', () => {
        const writeUTFBytes = (view: DataView, offset: number, string: string) => {
            const len = string.length
            for (let i = 0; i < len; i++) {
                view.setUint8(offset + i, string.charCodeAt(i))
            }
        }
        const flat32ArrayList = [base64ToFloat32Array(asc)]
        const length = flat32ArrayList.length * flat32ArrayList[0].length
        const mergedArray = new Float32Array(length)
        let offset = 0
        for (let i = 0; i < flat32ArrayList.length; i++) {
            mergedArray.set(flat32ArrayList[i], offset)
            offset += flat32ArrayList[i].length
        }

        const newDataView = new DataView(new ArrayBuffer(mergedArray.length))
        newDataView.setInt8(0, 255)
        const buffer = new ArrayBuffer(45)
        const view = new DataView(buffer)
        writeUTFBytes(view, 0, 'RIFF')
        view.setUint32(4, 38, true)
        writeUTFBytes(view, 8, 'WAVE')
        writeUTFBytes(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, 1, true)
        view.setUint32(24, 8000, true)
        view.setUint32(28, 8000, true)
        view.setUint16(32, 1, true)
        view.setUint16(34, 8, true)
        writeUTFBytes(view, 36, 'data')
        view.setUint32(40, 1, true)
        view.setUint8(offset, newDataView.getUint8(0)) // * (0x7fff * volume)
        const blob = new Blob([view], {
            type: 'audio/wav'
        })
        const actual = encodeWAV(flat32ArrayList, { sampleBits: 8, sampleRate: 8000, channelCount: 1 })
        expect(actual).toStrictEqual(blob)
    })
})
