import {
    DBPromise,
    ProgressTypes,
    PlayerTypes,
    reduxStore,
    fmp,
    isSnapshot,
    classifyRecords,
    isDev
} from '@TimeCat/utils'
import { ContainerComponent } from './container'
import { Panel } from './panel'
import pako from 'pako'
import io from 'socket.io-client'
import { SnapshotData } from '@TimeCat/snapshot'
import { RecordData, AudioData, RecorderOptions } from '@TimeCat/record'
import { ReplayOptions } from './types'

function getGZipData() {
    if (isDev) {
        ;(window as any).pako = pako
    }
    const data = window.__ReplayStrData__
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
    const replayData = JSON.parse(str) as Array<{
        snapshot: SnapshotData
        records: RecordData[]
        audio: AudioData
    }>
    if (isDev) {
        ;(window as any).data = replayData
    }
    return replayData
}

function dispatchEvent(type: string, data: RecordData) {
    event = new CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
}

async function getAsyncDataFromSocket(
    uri: string
): Promise<Array<{ snapshot: SnapshotData; records: RecordData[]; audio: AudioData }>> {
    var socket = io(uri)
    return await new Promise(resolve => {
        let initialized = false
        socket.on('record-data', (data: SnapshotData | RecordData) => {
            if (initialized) {
                dispatchEvent('record-data', data as RecordData)
            } else {
                if (data && isSnapshot(data)) {
                    resolve([
                        {
                            snapshot: data as SnapshotData,
                            records: [],
                            audio: { src: '', bufferStrList: [], subtitles: [], opts: {} as RecorderOptions }
                        }
                    ])
                    fmp.observe()
                    initialized = true
                }
            }
        })
    })
}

async function getDataFromDB() {
    const indexedDB = await DBPromise
    const data = await indexedDB.readAllRecords()
    return classifyRecords(data)
}

async function getReplayData() {
    const { socketUrl } = window.__ReplayOptions__

    const replayDataList =
        (socketUrl && (await getAsyncDataFromSocket(socketUrl))) ||
        getGZipData() ||
        (await getDataFromDB()) ||
        window.__ReplayDataList__

    if (!replayDataList) {
        return null
    }
    window.__ReplayDataList__ = replayDataList
    window.__ReplayData__ = Object.assign(
        {
            index: 0
        },
        replayDataList[0]
    )
    return window.__ReplayData__
}

export async function replay(options: ReplayOptions = { autoplay: true }) {
    window.__ReplayOptions__ = options
    const replayData = await getReplayData()

    if (!replayData) {
        return
    }

    const { records, audio } = replayData

    const c = new ContainerComponent()

    fmp.ready(async () => {
        new Panel(c)

        if (records.length) {
            const firstRecord = records[0]

            const replayList = window.__ReplayDataList__
            const startTime = firstRecord.time
            const endTime =
                replayList
                    .map(r => r.records)
                    .reduce((acc, records) => {
                        return acc + (+records.slice(-1)[0].time - +records[0].time)
                    }, 0) + +startTime

            reduxStore.dispatch({
                type: ProgressTypes.INFO,
                data: {
                    frame: 0,
                    curTime: startTime,
                    startTime,
                    endTime,
                    length: records.length
                }
            })

            const hasAudio = audio && (audio.src || audio.bufferStrList.length)

            if (hasAudio) {
                await waitStart()
            }
            removeStartPage()

            if (options.autoplay || hasAudio) {
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

    function removeStartPage() {
        const startPage = document.querySelector('#cat-start-page')!
        startPage.parentElement!.removeChild(startPage)
    }

    async function waitStart(): Promise<void> {
        const startPage = document.querySelector('#cat-start-page')! as HTMLElement
        startPage.setAttribute('style', '')
        return new Promise(r => {
            const playBtn = document.querySelector('.play-btn')!
            playBtn.addEventListener('click', async () => {
                r()
                startPage.className = 'clearly'
                await new Promise(rr => setTimeout(() => rr(), 500))
            })
        })
    }
}
