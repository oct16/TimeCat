import diff from 'diff'
import {
    VNode,
    VSNode,
    SnapshotData,
    RecordData,
    AudioRecord,
    AudioStrList,
    RecorderOptions,
    RecordType
} from '@timecat/share'

export const isDev = process.env.NODE_ENV === 'development'

export function logger(data: any) {
    console.log('record', data)
}

export function getTime() {
    return performance.timing.navigationStart + performance.now()
}

export function getRandomCode() {
    const code = (Math.random() * 20 + 16).toString(36).substring(4, 10)
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

export function isSnapshot(frame: RecordData | SnapshotData) {
    return (frame as SnapshotData).type === RecordType.SNAPSHOT && !(frame as SnapshotData).data.frameId
}

export function classifyRecords(data: (SnapshotData | RecordData)[]) {
    const dataList: ReplayData[] = []

    function isAudioBufferStr(frame: AudioRecord) {
        return frame.data.type === 'base64'
    }
    function isAudio(frame: RecordData | SnapshotData) {
        return (frame as RecordData).type === RecordType.AUDIO
    }

    let dataBasket: ReplayData
    data.forEach(item => {
        if (isSnapshot(item)) {
            dataBasket = {
                snapshot: item as SnapshotData,
                records: [],
                audio: {
                    src: '',
                    bufferStrList: [],
                    subtitles: [],
                    opts: {} as RecorderOptions
                }
            }
            dataList.push(dataBasket)
        } else if (isAudio(item)) {
            if (isAudioBufferStr(item as AudioRecord)) {
                const audioData = item as AudioRecord
                dataBasket.audio.bufferStrList.push(...(audioData.data as AudioStrList).data)
            } else {
                dataBasket.audio.opts = (item as AudioRecord).data.data as RecorderOptions
            }
        } else {
            dataBasket.records.push(item as RecordData)
        }
    })

    return dataList
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
    var tag = document.createElement('a')
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
