import diff from 'diff'
import { radix64 } from '../performance/radix64'
import {
    VNode,
    VSNode,
    SnapshotRecord,
    RecordData,
    AudioRecord,
    AudioStrList,
    RecorderOptions,
    RecordType,
    ReplayData,
    ReplayPack,
    ReplayHead
} from '@timecat/share'

export const isDev = process.env.NODE_ENV === 'development'

export function logger(data: any) {
    // console.log('record', data)
}

function logErrorOverload(e: Error): string
function logErrorOverload(msg: string): string
function logErrorOverload(e: Error | string): string {
    const msg = (e as Error).message || (e as string)
    console.error(`TimeCat Error: ${msg}`)
    return msg
}

export const logError = logErrorOverload

export function getTime(): number {
    return Math.floor(performance.timing.navigationStart + performance.now())
}

export function getRadix64TimeStr() {
    return radix64.btoa(getTime())
}

export function getRandomCode(len: 6 | 7 | 8 = 8) {
    const code = (Math.random() * 20 + 16).toString(36).substring(2, len + 2)
    return code.toUpperCase()
}

export function secondToDate(ms: number) {
    if (ms <= 0) {
        ms = 0
    }
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}

export function toTimeStamp(timeStr: string) {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
        const [min, sec] = parts
        return (+min * 60 + +sec) * 1000
    }

    const [hour, min, sec] = parts
    return (+hour * 3600 + +min * 60 + +sec) * 1000
}

export function isSnapshot(frame: RecordData) {
    return (frame as SnapshotRecord).type === RecordType.SNAPSHOT && !(frame as SnapshotRecord).data.frameId
}

export function classifyRecords(records: RecordData[]) {
    const packs: ReplayPack[] = []

    function isAudioBufferStr(frame: AudioRecord) {
        return frame.data.type === 'base64'
    }

    function isSameHEAD(head: ReplayHead, compare: ReplayHead) {
        return head.href === compare.href // && head.sessionId === compare.sessionId
    }

    let replayPack: ReplayPack
    let replayData: ReplayData
    records.forEach((record, index) => {
        const next = records[index + 1]
        switch (record.type) {
            case RecordType.HEAD:
                const headData = record.data
                const lastHEAD = replayPack && replayPack.head

                if (lastHEAD && isSameHEAD(headData, lastHEAD)) {
                    break
                }

                replayPack = {
                    head: headData,
                    body: []
                }
                if (next && !(next.data as SnapshotRecord['data']).frameId) {
                    if (replayPack) {
                        packs.push(replayPack)
                    }
                }
                break
            case RecordType.SNAPSHOT:
                if (!record.data.frameId) {
                    replayData = {
                        snapshot: record as SnapshotRecord,
                        records: [],
                        audio: {
                            src: '',
                            bufferStrList: [],
                            subtitles: [],
                            opts: {} as RecorderOptions
                        }
                    }
                    if (replayData && replayPack) {
                        replayPack.body.push(replayData)
                    }
                } else {
                    replayData.records.push(record)
                }
                break
            case RecordType.AUDIO:
                if (isAudioBufferStr(record as AudioRecord)) {
                    const audioData = record as AudioRecord
                    replayData.audio.bufferStrList.push(...(audioData.data as AudioStrList).data)
                } else {
                    replayData.audio.opts = (record as AudioRecord).data.data as RecorderOptions
                }
                break

            default:
                replayData.records.push(record as RecordData)
                break
        }
    })

    return packs
}

export async function delay(t = 200) {
    return new Promise(r => {
        setTimeout(() => r(), t)
    })
}
export function isVNode(n: VNode | VSNode) {
    return !!(n as VNode).tag
}

export function download(src: Blob | string, name: string) {
    const tag = document.createElement('a')
    tag.download = name
    if (typeof src === 'string') {
        tag.href = src
        tag.click()
    } else {
        tag.href = URL.createObjectURL(src)
        tag.click()
        URL.revokeObjectURL(tag.href)
    }
}

export function getStrDiffPatches(oldStr: string, newStr: string) {
    return getPatches(diff.diffChars(oldStr, newStr))
}

export function revertStrByPatches(str: string, changes: ReturnType<typeof getStrDiffPatches>) {
    changes.forEach((change: any) => {
        const { type, value, len } = change
        switch (type) {
            case 'add':
                str = str.substring(0, change.index) + value + str.substring(change.index)
                break
            case 'rm':
                str = str.substring(0, change.index) + str.substring(change.index + len)
                break
        }
    })
    return str
}

function getPatches(changes: diff.Change[]) {
    let index = 0
    const patches = changes
        .map(change => {
            const { added: add, removed: rm, value, count } = change
            const len = count || 0
            if (add) {
                const ret = {
                    index,
                    type: 'add',
                    value
                }
                index += len
                return ret
            } else if (rm) {
                const ret = {
                    index,
                    type: 'rm',
                    len
                }
                return ret
            }
            index += len
        })
        .filter(Boolean)

    return patches as Array<{
        index: number
        type: 'add' | 'rm'
        value?: string
        len?: number
    }>
}
