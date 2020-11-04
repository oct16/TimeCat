import { WindowWatcher } from '../../src/watchers/window'
import { getHeadData } from '../../src/head'
import { RecordType, WindowRecord } from '@timecat/share'

describe('Test of windowWatcher', () => {
    const storedRecordData: WindowRecord[] = []
    beforeAll(async () => {
        global.document = window.document
        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 222
            }
        })

        const headData = await getHeadData()
        new WindowWatcher({
            recorder: jest.fn(),
            context: window,
            listenStore: new Set(),
            relatedId: headData.relatedId,
            emit: (data: WindowRecord) => storedRecordData.push(data),
            watchers: new Map()
        })
    })

    it('Should return one record after WindowWatcher initialized', () => {
        expect(storedRecordData).toHaveLength(1)
        expect(storedRecordData[0].type).toEqual(RecordType.WINDOW)
    })

    it('Should add one record when resized', async () => {
        global.dispatchEvent(new Event('resize'))
        expect(storedRecordData).toHaveLength(2)
    })

    it('Should add one record even resized several times (throttle)', done => {
        setTimeout(() => {
            for (let idx = 0; idx < 5; idx++) {
                global.dispatchEvent(new Event('resize'))
            }
            expect(storedRecordData).toHaveLength(3)
            done()
        }, 1000)

        setTimeout(() => {
            expect(storedRecordData).toHaveLength(4)
            done()
        }, 1600)
    })

    it('Should add multi records when resize every 600', done => {
        let idx = 1
        const timer = setInterval(() => {
            global.dispatchEvent(new Event('resize'))
            if (idx > 10) {
                clearInterval(timer)
                expect(storedRecordData).toHaveLength(10)
                done()
            }
            idx += 2
        }, 600)
    })
})
