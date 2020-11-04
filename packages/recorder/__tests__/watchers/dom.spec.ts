import { DOMRecord } from '@timecat/share'
import { getHeadData } from '../../src/head'
import { DOMWatcher } from '../../src/watchers/dom'
import { nodeStore } from '@timecat/utils'

describe('Test of dom watcher', () => {
    const storedRecordData: DOMRecord[] = []
    global.document = window.document
    const div = document.createElement('div')
    const textNode = document.createTextNode('test')
    const ul = document.createElement('ul')
    const li1 = document.createElement('li')

    beforeAll(async () => {
        window.G_RECORD_OPTIONS = { mode: 'default', write: true, keep: false, context: window, font: false }

        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 222
            }
        })
        const headData = await getHeadData()
        new DOMWatcher({
            recorder: jest.fn(),
            context: window,
            listenStore: new Set(),
            relatedId: headData.relatedId,
            emit: (data: DOMRecord) => storedRecordData.push(data),
            watchers: new Map()
        })
        ul.appendChild(li1)
        div.appendChild(ul)
        div.appendChild(textNode)
        document.body.appendChild(div)
    })
    it('should return addedNodes type', done => {
        setTimeout(() => {
            expect(storedRecordData).toHaveLength(1)
            expect(storedRecordData[0].data).toHaveProperty('addedNodes')
            expect(storedRecordData[0].data.addedNodes).toHaveLength(4)
            done()
        }, 100)
    })

    describe('attr changed without affecting the dom tree', () => {
        it('should return one attrs data when attr changed', done => {
            div.id = 'divTag'
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(2)
                expect(storedRecordData[1].data).toHaveProperty('attrs', [
                    { id: nodeStore.getNodeId(div), key: 'id', value: 'divTag' }
                ])
                done()
            }, 100)
        })

        it('should not return recordData when new value is same as the old one ', done => {
            div.id = 'divTag'
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(2)
                done()
            })
        })

        it('should return one attrs with 2 value fields', done => {
            div.id = 'divTest'
            div.title = 'divTitle'
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(3)
                expect(storedRecordData[2].data).toHaveProperty('attrs', [
                    { id: nodeStore.getNodeId(div), key: 'id', value: 'divTest' },
                    { id: nodeStore.getNodeId(div), key: 'title', value: 'divTitle' }
                ])
                done()
            })
        })
    })

    it('should return one text recordData', done => {
        textNode.appendData(' text node')
        setTimeout(() => {
            expect(storedRecordData).toHaveLength(4)
            expect(storedRecordData[3].data).toHaveProperty('texts', [
                { id: nodeStore.getNodeId(textNode), parentId: nodeStore.getNodeId(div), value: 'test text node' }
            ])
            done()
        })
    })

    describe('childList', () => {
        const p1 = document.createElement('p')
        const p2 = document.createElement('p')
        const span = document.createElement('span')
        const h = document.createElement('h1')
        beforeAll(() => {
            p2.appendChild(span)
            document.body.appendChild(p2)
            document.body.insertBefore(p1, p2)
        })
        it('should return one addedNode data when add new Node', done => {
            expect(storedRecordData).toHaveLength(5)
            expect(storedRecordData[4].data).toHaveProperty('addedNodes', [
                {
                    parentId: nodeStore.getNodeId(document.getElementsByTagName('body')[0]),
                    nextId: null,
                    node: { id: nodeStore.getNodeId(p2), type: 1, attrs: {}, tag: 'p', children: [], extra: {} }
                },
                {
                    parentId: nodeStore.getNodeId(p2),
                    nextId: null,
                    node: { id: nodeStore.getNodeId(span), type: 1, tag: 'span', children: [], extra: {}, attrs: {} }
                },
                {
                    parentId: nodeStore.getNodeId(document.getElementsByTagName('body')[0]),
                    nextId: nodeStore.getNodeId(p2),
                    node: { id: nodeStore.getNodeId(p1), type: 1, attrs: {}, tag: 'p', children: [], extra: {} }
                }
            ])
            done()
        })
        it('should return one movedNodes data when add existing node', done => {
            p2.insertBefore(ul, span)
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(6)
                expect(storedRecordData[5].data).toHaveProperty('movedNodes', [
                    {
                        parentId: nodeStore.getNodeId(p2),
                        nextId: nodeStore.getNodeId(span),
                        id: nodeStore.getNodeId(ul)
                    }
                ])
                done()
            })
        })

        it('move node', done => {
            div.removeChild(textNode)
            p1.appendChild(textNode)
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(7)
                expect(storedRecordData[6].data).toHaveProperty('movedNodes', [
                    { parentId: nodeStore.getNodeId(p1), nextId: null, id: nodeStore.getNodeId(textNode) }
                ])
                done()
            })
        })
        it('remove node', done => {
            ul.removeChild(li1)
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(8)
                expect(storedRecordData[7].data).toHaveProperty('removedNodes', [
                    { parentId: nodeStore.getNodeId(ul), id: nodeStore.getNodeId(li1) }
                ])
                done()
            })
        })
        it('replace node', done => {
            p2.replaceChild(h, span)
            setTimeout(() => {
                expect(storedRecordData).toHaveLength(9)
                expect(storedRecordData[8].data).toHaveProperty('addedNodes', [
                    {
                        parentId: nodeStore.getNodeId(p2),
                        nextId: null,
                        node: { id: nodeStore.getNodeId(h), type: 1, attrs: {}, tag: 'h1', children: [], extra: {} }
                    }
                ])
                expect(storedRecordData[8].data).toHaveProperty('removedNodes', [
                    { parentId: nodeStore.getNodeId(p2), id: nodeStore.getNodeId(span) }
                ])
                done()
            })
        })
    })
    // todo: iframe canvas
})
