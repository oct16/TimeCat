import { FontRecord, RecordType } from '@timecat/share'
import { FontWatcher } from '../../src/watchers/font'
import { getHeadData } from '../../src/head'

describe('Test of font', () => {
    const storedRecordData: FontRecord[] = []
    global.document = window.document

    beforeAll(async () => {
        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 222
            }
        })
        Object.defineProperty(window, 'FontFace', {
            value: jest.fn(),
            writable: true
        })
        Object.defineProperty(document, 'fonts', {
            value: {
                add: jest.fn()
            },
            writable: true
        })
    })

    it('should not return record when option.font is false event Font changed', async () => {
        window.G_RECORD_OPTIONS = { mode: 'default', write: true, keep: false, context: window, font: false }

        try {
            const headData = await getHeadData()
            new FontWatcher({
                recorder: jest.fn(),
                context: window,
                listenStore: new Set(),
                relatedId: headData.relatedId,
                emit: (data: FontRecord) => storedRecordData.push(data),
                watchers: new Map()
            })
            new window.FontFace('Roboto', 'url(https://fonts.example.com/roboto.woff2)')
            expect(storedRecordData).toHaveLength(0)
        } catch (e) {}
    })

    it('should return one record when option.font is true', async () => {
        window.G_RECORD_OPTIONS = { mode: 'default', write: true, keep: false, context: window, font: true }
        try {
            const headData = await getHeadData()
            new FontWatcher({
                recorder: jest.fn(),
                context: window,
                listenStore: new Set(),
                relatedId: headData.relatedId,
                emit: (data: FontRecord) => storedRecordData.push(data),
                watchers: new Map()
            })
            new window.FontFace('Roboto', 'url(https://fonts.example.com/roboto.woff2)')
            expect(storedRecordData).toHaveLength(1)
            expect(storedRecordData[0].type).toEqual(RecordType.FONT)
            expect(storedRecordData[0].data).toStrictEqual({
                family: 'Roboto',
                source: 'url(https://fonts.example.com/roboto.woff2)'
            })
        } catch (e) {}
    })
})
