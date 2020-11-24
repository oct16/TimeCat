import {
    getTime,
    isSnapshot,
    secondToTime,
    toTimeStamp,
    transRecordsToPacks,
    isVNode,
    logError,
    getRandomCode
} from '../src/tools/common'
import { RecordData, AudioOptionsData, VNode } from '@timecat/share'

describe('Test of common', () => {
    it('logError', () => {
        expect(logError({ name: 'test error', message: 'test error message' })).toEqual('test error message')
    })

    it('getRandomCode', () => {
        expect(getRandomCode(6)).toHaveLength(6)
        expect(getRandomCode(6)).not.toEqual(getRandomCode(6))
        expect(getRandomCode(7)).toHaveLength(7)
        expect(getRandomCode()).toHaveLength(8)
    })

    it('getTime', done => {
        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 111.2
            }
        })
        const time = getTime()
        expect(getTime()).toBeGreaterThanOrEqual(time)

        setTimeout(() => {
            expect(getTime()).toBeGreaterThan(time)
            done()
        }, 2)
    })

    it('secondToTime and toTimeStamp', () => {
        const second = 1601134
        const date = '444:45:34'
        const actualDate = secondToTime(second)

        expect(secondToTime(-1)).toEqual('00:00')
        expect(actualDate).toEqual(date)

        expect(toTimeStamp(date)).toEqual(second * 1000)
        expect(toTimeStamp('45:34')).toEqual(2734000)
    })

    it('isSnapshot', () => {
        const frame = {
            type: 1,
            data: {
                frameId: null,
                href: 'http://localhost:3001/record',
                vNode: {
                    attrs: {},
                    children: [],
                    extra: {},
                    id: 1,
                    tag: 'html',
                    type: 1
                },
                width: 2500,
                height: 1329,
                scrollLeft: 0,
                scrollTop: 0
            },
            time: 1,
            relatedId: 'OAW2B2TQ'
        }

        expect(isSnapshot(frame as RecordData)).toBeTruthy()
    })

    it('isVNode', () => {
        expect(isVNode({ tag: '' } as VNode)).toBeFalsy()
        expect(isVNode({ tag: 'div' } as VNode)).toBeTruthy()
    })

    describe('transRecordsToPacks', () => {
        const commonRecords = [
            {
                type: 0,
                time: 1,
                relatedId: 'OAW2B2TQ',
                id: 804,
                data: {
                    href: 'http://localhost:3001/record',
                    relatedId: 'OAW2B2TQ',
                    userAgent:
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) Ap…L, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                    platform: 'MacIntel',
                    beginTime: '1601094836872',
                    fp: '9cf173ac4fdbeb5fd9d5d7f5d3167fa9',
                    version: '1.2.0-alpha.11'
                }
            },
            {
                type: 1,
                data: {
                    frameId: null,
                    href: 'http://localhost:3001/record',
                    vNode: { attrs: {}, children: [], extra: {}, id: 1, tag: 'html', type: 1 },
                    doctype: null,
                    width: 2500,
                    height: 1329,
                    scrollLeft: 0,
                    scrollTop: 0
                },
                time: 2,
                relatedId: 'OAW2B2TQ'
            },
            {
                type: 1,
                data: {
                    frameId: 111,
                    href: 'http://localhost:3001/record',
                    vNode: { attrs: {}, children: [], extra: {}, id: 1, tag: 'html', type: 1 },
                    doctype: null,
                    width: 2500,
                    height: 1329,
                    scrollLeft: 0,
                    scrollTop: 0
                },
                time: 3,
                relatedId: 'OAW2B2TQ'
            },
            {
                type: 8,
                time: 4,
                relatedId: 'OAW2B2TQ',
                id: 808,
                data: { type: 'opts', data: { sampleBits: 8, sampleRate: 8000, channelCount: 1 } }
            },
            {
                type: 8,
                time: 4,
                relatedId: 'OAW2B2TQ',
                id: 809,
                data: { type: 'base64', data: ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'] }
            },
            {
                id: 826,
                relatedId: 'OAW2B2TQ',
                time: 5,
                type: 2,
                data: {
                    height: 1329,
                    id: null,
                    width: 1599
                }
            }
        ]
        const expected = [
            {
                head: {
                    href: 'http://localhost:3001/record',
                    relatedId: 'OAW2B2TQ',
                    userAgent:
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) Ap…L, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                    platform: 'MacIntel',
                    beginTime: '1601094836872',
                    fp: '9cf173ac4fdbeb5fd9d5d7f5d3167fa9',
                    version: '1.2.0-alpha.11'
                },
                body: [
                    {
                        snapshot: {
                            type: 1,
                            data: {
                                frameId: null,
                                href: 'http://localhost:3001/record',
                                vNode: { attrs: {}, children: [], extra: {}, id: 1, tag: 'html', type: 1 },
                                doctype: null,
                                width: 2500,
                                height: 1329,
                                scrollLeft: 0,
                                scrollTop: 0
                            },
                            time: 2,
                            relatedId: 'OAW2B2TQ'
                        },
                        records: [
                            {
                                type: 1,
                                data: {
                                    frameId: 111,
                                    href: 'http://localhost:3001/record',
                                    vNode: { attrs: {}, children: [], extra: {}, id: 1, tag: 'html', type: 1 },
                                    doctype: null,
                                    width: 2500,
                                    height: 1329,
                                    scrollLeft: 0,
                                    scrollTop: 0
                                },
                                time: 3,
                                relatedId: 'OAW2B2TQ'
                            },
                            {
                                id: 826,
                                relatedId: 'OAW2B2TQ',
                                time: 5,
                                type: 2,
                                data: {
                                    height: 1329,
                                    id: null,
                                    width: 1599
                                }
                            }
                        ],
                        audio: {
                            src: '',
                            bufferStrList: ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
                            subtitles: [],
                            opts: { sampleBits: 8, sampleRate: 8000, channelCount: 1 } as AudioOptionsData
                        }
                    }
                ]
            }
        ]
        it('records include [head, snapshot, audio]', () => {
            const actual = transRecordsToPacks(commonRecords as RecordData[])
            expect(actual).toStrictEqual(expected)
        })
        it('same head', () => {
            const twoSameHeadRecords = commonRecords.concat([
                {
                    type: 0,
                    time: 1,
                    relatedId: 'OAW2B2TQ',
                    id: 809,
                    data: {
                        href: 'http://localhost:3001/record',
                        relatedId: 'OAW2B2TQ',
                        userAgent:
                            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) Ap…L, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                        platform: 'MacIntel',
                        beginTime: '1601094836872',
                        fp: '9cf173ac4fdbeb5fd9d5d7f5d3167fa9',
                        version: '1.2.0-alpha.11'
                    }
                }
            ])
            const twoSameHeadActual = transRecordsToPacks(twoSameHeadRecords as RecordData[])

            expect(twoSameHeadActual).toStrictEqual(expected)
        })
    })

    // it('getStrDiffPatches and revertStrByPatches', () => {
    //     const newStr = 'newStr'
    //     const oldStr = 'oldStr'
    //     const expected = [
    //         { index: 0, type: 'rm', len: 3 },
    //         { index: 0, type: 'add', value: 'new' }
    //     ]
    //     expect(getStrDiffPatches(oldStr, newStr)).toStrictEqual(expected)
    //     expect(revertStrByPatches(oldStr, expected as ReturnType<typeof getStrDiffPatches>)).toEqual(newStr)
    // })
})
