import { getHeadData } from '../../src/head'
import { Snapshot } from '../../src/snapshot'
import { SnapshotRecord } from '@timecat/share'
import { nodeStore } from '@timecat/utils'

describe('Test snapshot', () => {
    const storedRecordData: SnapshotRecord[] = []
    beforeAll(async () => {
        global.document = window.document
        document.body.innerHTML = '<div id="divTag1"><p><span>1</span><span>2</span></p></div><div id="divTag2"></div>'

        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 222
            }
        })
        const headData = await getHeadData()
        window.G_RECORD_OPTIONS = { mode: 'default', write: true, keep: false, context: window, font: false }

        new Snapshot({
            recorder: jest.fn(),
            context: window,
            listenStore: new Set(),
            relatedId: headData.relatedId,
            emit: (data: SnapshotRecord) => storedRecordData.push(data),
            watchers: new Map()
        })
    })

    it('emit data after Snapshot initialized', () => {
        expect(storedRecordData).toHaveLength(1)
        expect(storedRecordData[0].data).toHaveProperty('vNode', {
            id: nodeStore.getNodeId(document.getElementsByTagName('html')[0]),
            type: 1,
            attrs: {},
            tag: 'html',
            children: [
                {
                    id: nodeStore.getNodeId(document.getElementsByTagName('head')[0]),
                    type: 1,
                    attrs: {},
                    tag: 'head',
                    children: [],
                    extra: {}
                },
                {
                    id: nodeStore.getNodeId(document.getElementsByTagName('body')[0]),
                    type: 1,
                    attrs: {},
                    tag: 'body',
                    children: [
                        {
                            id: nodeStore.getNodeId(document.getElementById('divTag1') as Node),
                            type: 1,
                            attrs: { id: 'divTag1' },
                            tag: 'div',
                            children: [
                                {
                                    id: nodeStore.getNodeId(document.getElementsByTagName('p')[0]),
                                    type: 1,
                                    attrs: {},
                                    tag: 'p',
                                    children: [
                                        {
                                            id: nodeStore.getNodeId(document.getElementsByTagName('span')[0]),
                                            type: 1,
                                            attrs: {},
                                            tag: 'span',
                                            children: [
                                                {
                                                    id: nodeStore.getNodeId(
                                                        document.getElementsByTagName('span')[0].childNodes[0]
                                                    ),
                                                    type: 3,
                                                    value: '1'
                                                }
                                            ],
                                            extra: {}
                                        },
                                        {
                                            id: nodeStore.getNodeId(document.getElementsByTagName('span')[1]),
                                            type: 1,
                                            attrs: {},
                                            tag: 'span',
                                            children: [
                                                {
                                                    id: nodeStore.getNodeId(
                                                        document.getElementsByTagName('span')[1].childNodes[0]
                                                    ),
                                                    type: 3,
                                                    value: '2'
                                                }
                                            ],
                                            extra: {}
                                        }
                                    ],
                                    extra: {}
                                }
                            ],
                            extra: {}
                        },
                        {
                            id: nodeStore.getNodeId(document.getElementById('divTag2') as Node),
                            type: 1,
                            attrs: { id: 'divTag2' },
                            tag: 'div',
                            children: [],
                            extra: {}
                        }
                    ],
                    extra: {}
                }
            ],
            extra: {}
        })
        expect(storedRecordData[0].data).toHaveProperty('doctype', { name: 'html', publicId: '', systemId: '' })
        expect(storedRecordData[0].data).toHaveProperty('href', 'http://localhost/')
        expect(storedRecordData[0].data).toHaveProperty('scrollTop', 0)
        expect(storedRecordData[0].data).toHaveProperty('scrollLeft', 0)
        expect(storedRecordData[0].data).toHaveProperty('width', 1024)
        expect(storedRecordData[0].data).toHaveProperty('height', 768)
        expect(storedRecordData[0].data).toHaveProperty('frameId', null)
    })
})
