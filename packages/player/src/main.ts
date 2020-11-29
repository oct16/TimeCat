import { isSnapshot, transRecordsToPacks, logError, nodeStore, debounce, getRecordsFromDB } from '@timecat/utils'
import { ContainerComponent } from './components/container'
import pako from 'pako'
import {
    SnapshotRecord,
    ReplayOptions,
    RecordData,
    AudioOptionsData,
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

const defaultReplayOptions = {
    autoplay: true,
    mode: 'default',
    target: window,
    timeMode: 'durationTime',
    fastForward: [4, 16]
}

export class Player {
    on: (key: PlayerEventTypes, fn: Function) => void
    destroy: () => void
    append: (records: RecordData[]) => void

    constructor(options?: ReplayOptions) {
        const player = new PlayerModule(options)
        const { on, destroy, append } = player

        this.on = on.bind(player)
        this.destroy = destroy.bind(player)
        this.append = append.bind(player)
    }
}

export class PlayerModule {
    c: ContainerComponent
    fmp: FMP
    destroyStore = new Set<Function>()
    constructor(options?: ReplayOptions) {
        nodeStore.reset()
        this.init(options)
    }

    private async init(options?: ReplayOptions) {
        const opts = {
            destroyStore: this.destroyStore,
            ...defaultReplayOptions,
            ...options
        } as ReplayInternalOptions

        window.G_REPLAY_OPTIONS = opts

        this.destroyStore.add(() => reduxStore.unsubscribe())

        const replayPacks = await this.getReplayPacks(opts)

        if (!replayPacks || !replayPacks.length) {
            return
        }

        const { records, audio } = (window.G_REPLAY_DATA = this.getFirstReplayData(replayPacks))
        const hasAudio = audio && (audio.src || audio.bufferStrList.length)

        if (records.length) {
            this.calcProgress(replayPacks)
        }

        const c = (this.c = new ContainerComponent(opts))
        const container = c.container
        showStartMask(c)

        this.fmp = new FMP()

        this.fmp.ready(async () => {
            if (hasAudio) {
                await waitStart(container)
            }

            removeStartPage(container)

            if (records.length) {
                if (opts.autoplay || hasAudio) {
                    reduxStore.dispatch({
                        type: PlayerTypes.SPEED,
                        data: { speed: 1 }
                    })
                }
            }
        })

        if (!records.length) {
            const panel = c.container.querySelector('.player-panel')
            if (panel) {
                panel.setAttribute('style', 'display: none')
            }
        }
    }

    private calcProgress(replayPacks: ReplayPack[]) {
        const firstPack = replayPacks[0]
        const { beginTime } = firstPack.head

        const startTime = beginTime
        const { endTime, frames } = replayPacks.reduce(
            (packsAcc, pack) => {
                const { frames, endTime } = pack.body
                    .map((replayData: ReplayData) => replayData.records)
                    .reduce(
                        (acc, records: RecordData[]) => {
                            acc.endTime += records.length ? records.slice(-1)[0].time - records[0].time : 0
                            acc.frames += records.length
                            return acc
                        },
                        { endTime: 0, frames: 0 }
                    )

                packsAcc.frames += frames
                packsAcc.endTime += endTime
                return packsAcc
            },
            { endTime: startTime, frames: 0 }
        )

        reduxStore.dispatch({
            type: ProgressTypes.PROGRESS,
            data: {
                frames,
                startTime,
                endTime
            }
        })
    }

    private getFirstReplayData(replayPacks: ReplayPack[]) {
        return replayPacks[0].body[0]
    }

    private getGZipData() {
        const data = window.G_REPLAY_STR_RECORDS
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
        const records = JSON.parse(str) as RecordData[]

        return transRecordsToPacks(records)
    }

    private dispatchEvent(type: string, data: RecordData) {
        const event = new CustomEvent(type, { detail: data })
        window.dispatchEvent(event)
    }

    private async dataReceiver(receiver: (sender: (data: RecordData) => void) => void): Promise<ReplayPack[]> {
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
                                audio: { src: '', bufferStrList: [], subtitles: [], opts: {} as AudioOptionsData }
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

    private async getPacksFromDB() {
        const records = await getRecordsFromDB()

        if (records && records.length) {
            return transRecordsToPacks(records)
        }
    }

    private async getReplayPacks(options: ReplayInternalOptions) {
        const { receiver, packs, records } = options

        const replayPacks =
            (records && transRecordsToPacks(records)) ||
            packs ||
            (receiver && (await this.dataReceiver(receiver))) ||
            this.getGZipData() ||
            (await this.getPacksFromDB()) ||
            (window.G_REPLAY_PACKS as ReplayPack[])

        if (!replayPacks) {
            throw logError('Replay data not found')
        }

        if (replayPacks) {
            window.G_REPLAY_PACKS = replayPacks
            return replayPacks
        }

        return null
    }

    private triggerCalcProgress = debounce(() => this.calcProgress(window.G_REPLAY_PACKS), 500)

    destroy() {
        this.destroyStore.forEach(un => un())
        observer.destroy()
    }

    on(key: PlayerEventTypes, fn: Function) {
        observer.on(key, fn)
    }

    append(data: RecordData[] | ReplayPack | ReplayPack[]) {
        function isPack(data: any) {
            return data.head && data.body
        }

        let packs: ReplayPack[]
        if (Array.isArray(data)) {
            if (!isPack(data[0])) {
                packs = transRecordsToPacks(data as RecordData[])
            } else {
                packs = data as ReplayPack[]
            }
        } else {
            packs = [data]
        }

        const { G_REPLAY_PACKS: GPacks } = window
        GPacks.push(...packs)

        this.triggerCalcProgress()
    }
}
