import {
    getDBOperator,
    ProgressTypes,
    PlayerTypes,
    reduxStore,
    fmp,
    isSnapshot,
    classifyRecords,
    isDev,
    radix64
} from '@timecat/utils'
import { ContainerComponent } from './container'
import { Panel } from './panel'
import pako from 'pako'
import {
    SnapshotRecord,
    ReplayOptions,
    RecordData,
    RecorderOptions,
    ReplayData,
    ReplayPack,
    RecordType,
    ReplayHead
} from '@timecat/share'
import { waitStart, removeStartPage, showStartMask } from './dom'
import smoothScroll from 'smoothscroll-polyfill'

const defaultReplayOptions = { autoplay: true, mode: 'default' } as ReplayOptions

export async function replay(options: ReplayOptions) {
    const opts = { ...defaultReplayOptions, ...options }

    window.__ReplayOptions__ = opts
    smoothScroll.polyfill()

    const replayPacks = await getReplayData(opts)

    if (!replayPacks) {
        return
    }

    const { records, audio } = (window.__ReplayData__ = getFirstReplayData(replayPacks))
    const hasAudio = audio && (audio.src || audio.bufferStrList.length)

    const c = new ContainerComponent()
    new Panel(c)

    showStartMask()

    fmp.ready(async () => {
        if (hasAudio) {
            await waitStart()
        }
        removeStartPage()

        if (records.length) {
            const firstRecord = records[0]

            const replayPacks = window.__ReplayPacks__ as ReplayPack[]
            const startTime = firstRecord.time
            const endTime =
                replayPacks.reduce((packAcc, pack) => {
                    return (
                        packAcc +
                        pack.body
                            .map((replayData: ReplayData) => replayData.records)
                            .reduce((acc: number, records: RecordData[]) => {
                                return acc + (+records.slice(-1)[0].time - +records[0].time)
                            }, 0)
                    )
                }, 0) + +startTime

            reduxStore.dispatch({
                type: ProgressTypes.INFO,
                data: {
                    frame: 0,
                    curTime: Number(startTime),
                    startTime: Number(startTime),
                    endTime,
                    length: records.length
                }
            })

            if (opts.autoplay || hasAudio) {
                reduxStore.dispatch({
                    type: PlayerTypes.SPEED,
                    data: { speed: 1 }
                })
            }
        }
    })

    if (!records.length) {
        const panel = document.querySelector('#cat-panel')
        if (panel) {
            panel.setAttribute('style', 'display: none')
        }
    }
}

function getFirstReplayData(replayPacks: ReplayPack[]) {
    return replayPacks[0].body[0]
}

function getGZipData() {
    const data = window.__ReplayStrPacks__
    if (!data) {
        return null
    }

    const codeArray: number[] = []
    const strArray = data.split('')
    for (let i = 0; i < strArray.length; i++) {
        const num = strArray[i].charCodeAt(0)
        codeArray.push(num >= 300 ? num - 300 : num)
    }

    const str = pako.ungzip(codeArray, {
        to: 'string'
    })
    const packs = JSON.parse(str) as ReplayData[]

    return packs
}

function dispatchEvent(type: string, data: RecordData) {
    event = new CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
}

async function fetchData(input: RequestInfo, init?: RequestInit): Promise<ReplayPack[]> {
    return fetch(input, init).then(res => res.json())
}

async function dataReceiver(receiver: (sender: (data: RecordData) => void) => void): Promise<ReplayPack[]> {
    let replayPack: ReplayPack
    let head: ReplayHead
    const body: ReplayData[] = []
    return await new Promise(resolve => {
        receiver(data => {
            if (replayPack) {
                dispatchEvent('record-data', data as RecordData)
            } else {
                if (!data) {
                    return
                }

                if (data.type === RecordType.HEAD) {
                    head = data.data
                } else if (data && isSnapshot(data)) {
                    if (head && body) {
                        body.push({
                            snapshot: data as SnapshotRecord,
                            records: [],
                            audio: { src: '', bufferStrList: [], subtitles: [], opts: {} as RecorderOptions }
                        })

                        replayPack = {
                            head,
                            body
                        }

                        resolve([replayPack])
                        fmp.observe()
                    }
                } else {
                    throw new Error('TimeCat Error: ReplayHead not found')
                }
            }
        })
    })
}

async function getDataFromDB() {
    const DBOperator = await getDBOperator
    const data = await DBOperator.readAllRecords()

    if (data) {
        return classifyRecords(data)
    }

    return null
}

async function getReplayData(options: ReplayOptions) {
    const { receiver, replayPacks: data, fetch } = options

    const rawReplayPacks =
        data ||
        (fetch && (await fetchData(fetch.url, fetch.options))) ||
        (receiver && (await dataReceiver(receiver))) ||
        getGZipData() ||
        (await getDataFromDB()) ||
        window.__ReplayPacks__

    if (!rawReplayPacks) {
        throw new Error('TimeCat Error: Replay data not found')
    }

    const replayPacks = decodePacks(rawReplayPacks)

    if (replayPacks) {
        window.__ReplayPacks__ = replayPacks
        return replayPacks
    }

    return null
}

function decodePacks(packs: ReplayPack[]): ReplayPack[] {
    const { atob } = radix64
    packs.forEach(pack => {
        pack.body.forEach(data => {
            const { records, snapshot } = data
            snapshot.time = snapshot.time.length < 8 ? atob.call(radix64, snapshot.time) + '' : snapshot.time
            records.forEach(record => {
                record.time = record.time.length < 8 ? atob.call(radix64, record.time) + '' : record.time
            })
        })
    })
    return packs
}
