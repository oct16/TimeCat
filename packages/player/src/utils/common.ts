import {
    RecordData,
    ReplayData,
    RecordType,
    SnapshotRecord,
    AudioOptionsData,
    DBRecordData,
    AudioRecord,
    HeadRecord,
    AudioStrList
} from '@timecat/share'
import { decompressWithGzip } from 'brick.json/gzip/esm'
import { getDBOperator } from '@timecat/utils'

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

export function transToReplayData(records: RecordData[]): ReplayData {
    function isAudioBufferStr(record: AudioRecord) {
        return record.data.type === 'base64'
    }

    const replayData: ReplayData = {
        head: {} as HeadRecord,
        snapshot: {} as SnapshotRecord,
        records: [],
        audio: {
            src: '',
            bufferStrList: [],
            subtitles: [],
            opts: {} as AudioOptionsData
        }
    }
    records.forEach((record, index) => {
        const next = records[index + 1]
        switch (record.type) {
            case RecordType.HEAD:
                if (next && !(next.data as SnapshotRecord['data']).frameId) {
                    replayData.head = record
                }
                break
            case RecordType.SNAPSHOT:
                if (!record.data.frameId) {
                    if (replayData) {
                        replayData.snapshot = record
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
                    replayData.audio.opts = (record as AudioRecord).data.data as AudioOptionsData
                }
                break

            default:
                if (replayData) {
                    replayData.records.push(record as RecordData)
                }
                break
        }
    })

    return replayData
}

export function getGZipData() {
    const str = window.G_REPLAY_STR_RECORDS
    if (!str) {
        return null
    }

    return (decompressWithGzip(str) as unknown) as RecordData[]
}

export async function getRecordsFromDB() {
    const DBOperator = await getDBOperator
    const records: DBRecordData[] | null = await DBOperator.readAllRecords()
    if (records && records.length) {
        return records
    }
    return null
}

export function getPacks(records: RecordData[]) {
    const packs: RecordData[][] = []
    const pack: RecordData[] = []

    records.forEach((record, i) => {
        if (i && record.type === RecordType.HEAD) {
            packs.push(pack.slice())
            pack.length = 0
        }
        pack.push(record)

        if (records.length - 1 === i) {
            packs.push(pack)
        }
    })

    return packs
}
