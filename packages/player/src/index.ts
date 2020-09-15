import { getDBOperator, isSnapshot, classifyRecords, radix64, logError, nodeStore } from '@timecat/utils'
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
    ReplayHead,
    ReplayInternalOptions
} from '@timecat/share'
import { waitStart, removeStartPage, showStartMask } from './dom'
import { observer } from './utils/observer'
import { PlayerEventTypes } from './types'
import { FMP } from './utils/fmp'
import { PlayerTypes, ProgressTypes, reduxStore } from './utils'

const defaultReplayOptions = { autoplay: true, mode: 'default', target: window } as ReplayOptions

export class Player {
    fmp: FMP
    destroyStore = new Set<Function>()
    constructor(options?: ReplayOptions) {
        nodeStore.reset()
        this.init(options)
    }

    async init(options?: ReplayOptions) {
        const opts = { destroyStore: this.destroyStore, ...defaultReplayOptions, ...options } as ReplayInternalOptions

        window.G_REPLAY_OPTIONS = opts

        this.destroyStore.add(() => reduxStore.unsubscribe())

        const replayPacks = await this.getReplayData(opts)

        if (!replayPacks || !replayPacks.length) {
            return
        }

        const { records, audio } = (window.G_REPLAY_DATA = this.getFirstReplayData(replayPacks))
        const hasAudio = audio && (audio.src || audio.bufferStrList.length)

        const c = new ContainerComponent(opts)
        new Panel(c, opts)

        showStartMask()

        this.fmp = new FMP()

        this.fmp.ready(async () => {
            if (hasAudio) {
                await waitStart()
            }
            removeStartPage()

            if (records.length) {
                const firstRecord = records[0]

                const replayPacks = window.G_REPLAY_PACKS as ReplayPack[]
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
                    type: ProgressTypes.PROGRESS,
                    data: {
                        frames: records.length,
                        startTime: Number(startTime),
                        endTime
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

    getFirstReplayData(replayPacks: ReplayPack[]) {
        return replayPacks[0].body[0]
    }

    getGZipData() {
        const data = window.G_REPLAY_STR_PACKS
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

    dispatchEvent(type: string, data: RecordData) {
        const event = new CustomEvent(type, { detail: data })
        window.dispatchEvent(event)
    }

    async dataReceiver(receiver: (sender: (data: RecordData) => void) => void): Promise<ReplayPack[]> {
        let replayPack: ReplayPack
        let head: ReplayHead
        const body: ReplayData[] = []
        const self = this
        return await new Promise(resolve => {
            receiver(data => {
                if (replayPack) {
                    this.dispatchEvent('record-data', data as RecordData)
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

                            if (self.fmp) {
                                self.fmp.observe()
                            }
                        }
                    } else {
                        return
                        // logError('ReplayHead not found')
                    }
                }
            })
        })
    }

    async getDataFromDB() {
        const DBOperator = await getDBOperator
        const data = await DBOperator.readAllRecords()

        if (data) {
            return classifyRecords(data)
        }

        return null
    }

    async getReplayData(options: ReplayInternalOptions) {
        const { receiver, packs, records } = options

        const rawReplayPacks =
            (records && classifyRecords(records)) ||
            packs ||
            (receiver && (await this.dataReceiver(receiver))) ||
            this.getGZipData() ||
            (await this.getDataFromDB()) ||
            window.G_REPLAY_PACKS

        if (!rawReplayPacks) {
            throw logError('Replay data not found')
        }

        const replayPacks = this.decodePacks(rawReplayPacks)

        if (replayPacks) {
            window.G_REPLAY_PACKS = replayPacks
            return replayPacks
        }

        return null
    }

    decodePacks(packs: ReplayPack[]): ReplayPack[] {
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

    destroy() {
        this.destroyStore.forEach(un => un())
        observer.destroy()
    }

    on(key: PlayerEventTypes, fn: Function) {
        observer.on(key, fn)
    }
}
