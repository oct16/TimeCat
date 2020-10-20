import { base64ToFloat32Array, encodeWAV, float32ArrayToBase64 } from '@timecat/utils'

describe('Test of transform', () => {
    const base64Str = btoa('test')
    describe('float32ArrayToBase64 and base64ToFloat32Array', () => {
        it('should return Base64', () => {
            const float32Array = new Float32Array(4)
            const result = float32ArrayToBase64(float32Array)
            expect(btoa(atob(result))).toEqual(result)
        })

        it('should return Float32Array', () => {
            const result = base64ToFloat32Array(base64Str)
            expect(result instanceof Float32Array).toBeTruthy()
        })

        it('base64ToFloat32Array then float32ArrayToBase64', () => {
            const float32Array = base64ToFloat32Array(base64Str)
            const convertedBase64 = float32ArrayToBase64(float32Array)
            expect(convertedBase64).toEqual(base64Str)
        })
    })

    it('encodeWAV', () => {
        const result = encodeWAV([base64ToFloat32Array(base64Str)], {
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        })
        expect(result.type).toEqual('audio/wav')
    })
})
