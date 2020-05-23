import { RecordData } from '@TimeCat/record'
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

export function isSnapshot(frame: RecordData | SnapshotData) {
    return !!(frame as SnapshotData).vNode
}

export function classifyRecords(data: (SnapshotData | RecordData)[]) {
    const dataList: { snapshot: SnapshotData; records: RecordData[] }[] = []

    let viewData: { snapshot: SnapshotData; records: RecordData[] }
    data.forEach(item => {
        if (isSnapshot(item)) {
            viewData = { snapshot: item as SnapshotData, records: [] }
            dataList.push(viewData)
        } else {
            viewData.records.push(item as RecordData)
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
