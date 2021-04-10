import { Recorder, RecorderModule } from '@timecat/recorder'
import { delay } from '@timecat/utils'

describe('Testing Recorder', () => {
    test('Recorder status', async done => {
        const recorder = new Recorder()
        expect(recorder.status).toBe('running')
        await recorder.destroy()
        expect(recorder.status).toBe('halt')
        done()

        const module = new RecorderModule()
        expect(module.status).toBe('running')
        module.destroy()
        expect(module.status).toBe('pause')
        setTimeout(() => {
            expect(module.status).toBe('halt')
        }, 200)
        done()
    })

    test('Recorder Listeners', async () => {
        const recorder = new RecorderModule()
        await delay(200)
        expect(recorder['watchers'].length).toBeGreaterThan(0)
        expect(recorder['watchersInstance'].size).toBeGreaterThan(0)
        expect(recorder['destroyStore'].size).toBeGreaterThanOrEqual(0)
        expect(recorder['listenStore'].size).toBeGreaterThan(0)
        await recorder['pause']()
        expect(recorder['listenStore'].size).toBeLessThanOrEqual(0)
        expect(recorder['watchers'].length).toBeGreaterThan(0)
        recorder['record']({})
        await delay(200)
        await recorder.destroy()
        expect(recorder['watchers'].length).toBeGreaterThan(0)
        expect(recorder['watchersInstance'].size).toBeGreaterThan(0)
        expect(recorder['destroyStore'].size).toBe(0)
        expect(recorder['listenStore'].size).toBe(0)
    })
})
