import { logError, nodeStore, debounce } from '@timecat/utils'
import { ContainerComponent } from './components/container'
import pako from 'pako'
import {
    SnapshotRecord,
    ReplayOptions,
    RecordData,
    RecordType,
    ReplayInternalOptions,
    HeadRecord
} from '@timecat/share'
import { waitStart, removeStartPage, showStartMask } from './dom'
import { PlayerEventTypes } from './types'
import {
    FMP,
    observer,
    Store,
    PlayerTypes,
    getRecordsFromDB,
    ProgressTypes,
    ReplayDataReducerTypes,
    transToReplayData
} from './utils'

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

        this.destroyStore.add(() => Store.unsubscribe())

        const records = await this.getRecords(opts)
        const packs = this.getPacks(records)
        const firstData = transToReplayData(packs[0])
        const { audio } = firstData
        Store.dispatch({
            type: ReplayDataReducerTypes.UPDATE_DATA,
            data: { records, packs, currentData: firstData }
        })

        const hasAudio = audio && (audio.src || audio.bufferStrList.length)

        if (packs.length) {
            this.calcProgress()
        }

        this.c = new ContainerComponent(opts)
        const container = this.c.container
        showStartMask(this.c)
        ;(this.fmp = new FMP()).ready(async () => {
            if (hasAudio) {
                await waitStart(container)
            }

            removeStartPage(container)

            if (records.length) {
                if (opts.autoplay || hasAudio) {
                    if (opts.autoplay) {
                        Store.dispatch({
                            type: PlayerTypes.SPEED,
                            data: { speed: 1 }
                        })
                    }
                }
            }
        })

        if (records.length <= 2) {
            const panel = this.c.container.querySelector('.player-panel')
            if (panel) {
                panel.setAttribute('style', 'display: none')
            }
        }
    }

    getPacks(records: RecordData[]) {
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

    private async getRecords(options: ReplayInternalOptions) {
        const { receiver, records: recordsData } = options

        const records =
            recordsData ||
            (receiver && (await this.dataReceiver(receiver))) ||
            this.getGZipData() ||
            (await getRecordsFromDB())

        if (!records) {
            throw logError('Replay data not found')
        }

        return records
    }

    private calcProgress() {
        const { packs } = Store.getState().replayData
        const startTime = packs[0][0].time

        let duration = 0
        const packsInfo: {
            startTime: number
            endTime: number
            duration: number
        }[] = []
        packs.forEach(pack => {
            const startTime = pack[0].time
            const endTime = pack.slice(-1)[0].time
            const info = {
                startTime,
                endTime,
                duration: endTime - startTime
            }
            packsInfo.push(info)
            duration += info.duration
        })
        const endTime = startTime + duration

        Store.dispatch({
            type: ProgressTypes.PROGRESS,
            data: {
                duration,
                packsInfo,
                startTime,
                endTime
            }
        })
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
        return records
    }

    private dispatchEvent(type: string, data: RecordData) {
        const event = new CustomEvent(type, { detail: data })
        window.dispatchEvent(event)
    }

    private async dataReceiver(receiver: (sender: (data: RecordData) => void) => void): Promise<RecordData[]> {
        let isResolved: boolean
        let head: HeadRecord
        let snapshot: SnapshotRecord
        return await new Promise(resolve => {
            receiver(data => {
                if (isResolved) {
                    this.dispatchEvent('record-data', data as RecordData)
                } else {
                    if (head && snapshot) {
                        isResolved = true
                        resolve([head, snapshot])
                    } else {
                        if (data.type === RecordType.HEAD) {
                            head = data
                        } else if (data.type === RecordType.SNAPSHOT) {
                            snapshot = data
                        }
                    }
                }
            })
        })
    }

    private triggerCalcProgress = debounce(() => this.calcProgress(), 500)

    destroy() {
        this.destroyStore.forEach(un => un())
        observer.destroy()
    }

    on(key: PlayerEventTypes, fn: Function) {
        observer.on(key, fn)
    }

    append(records: RecordData[]) {
        Store.dispatch({
            type: ReplayDataReducerTypes.APPEND_RECORDS,
            data: { records }
        })

        this.triggerCalcProgress()
    }
}
