import { RecordData, AudioData, AudioWatcher, AudioStrList, RecorderOptions } from '@TimeCat/record'
import { SnapshotData } from '@TimeCat/snapshot'
import { VNode, VSNode } from '@TimeCat/virtual-dom'

export const isDev = process.env.NODE_ENV === 'development'

export function logger(data: any) {
    console.log('record', data)
}

export function getTime() {
    return performance.timing.navigationStart + performance.now()
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
    return !!(frame as SnapshotData).vNode
}

export function classifyRecords(data: (SnapshotData | RecordData)[]) {
    const dataList: { snapshot: SnapshotData; records: RecordData[]; audio: AudioData }[] = []

    function isAudioBufferStr(frame: AudioWatcher) {
        return frame.data.type === 'base64'
    }
    function isAudio(frame: RecordData | SnapshotData) {
        return (frame as RecordData).type === 'AUDIO'
    }

    let dataBasket: { snapshot: SnapshotData; records: RecordData[]; audio: AudioData }
    data.forEach(item => {
        if (isSnapshot(item)) {
            dataBasket = {
                snapshot: item as SnapshotData,
                records: [],
                audio: {
                    bufferStrList: [],
                    subtitles: [],
                    opts: {} as RecorderOptions
                }
            }
            dataList.push(dataBasket)
        } else if (isAudio(item)) {
            if (isAudioBufferStr(item as AudioWatcher)) {
                const audioData = item as AudioWatcher
                dataBasket.audio.bufferStrList.push(...(audioData.data as AudioStrList).data)
            } else {
                dataBasket.audio.opts = (item as AudioWatcher).data.data as RecorderOptions
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
