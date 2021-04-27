/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    logError,
    nodeStore,
    debounce,
    logInfo,
    isDev,
    removeGlobalVariables,
    delay,
    tempEmptyFn
} from '@timecat/utils'
import { ContainerComponent } from './components/container'
import {
    SnapshotRecord,
    ReplayOptions,
    RecordData,
    RecordType,
    ReplayInternalOptions,
    HeadRecord
} from '@timecat/share'
import { waitStart, removeStartPage, showStartMask } from './utils'
import { PlayerEventTypes } from './types'
import {
    FMP,
    observer,
    Store,
    PlayerReducerTypes,
    getRecordsFromDB,
    ProgressReducerTypes,
    ReplayDataReducerTypes,
    transToReplayData,
    getGZipData
} from './utils'
import { getPacks } from './utils/transform'

const defaultReplayOptions = {
    autoplay: true,
    mode: 'default',
    target: window,
    heatPoints: true,
    timeMode: 'durationTime',
    fastForward: [2, 8],
    cssOptions: {
        disablePointerEvents: true,
        disableScrollbars: true
    }
}

export class Player {
    on: (key: PlayerEventTypes, fn: Function) => void = tempEmptyFn
    destroy: () => void = tempEmptyFn
    append: (records: RecordData[]) => void = tempEmptyFn
    constructor(options?: ReplayOptions) {
        const player = new PlayerModule(options)
        Object.keys(this).forEach((key: keyof Player) => (this[key] = player[key].bind(player)))
    }
}

export class PlayerModule {
    c: ContainerComponent
    fmp: FMP
    destroyStore = new Set<Function>()
    options: ReplayInternalOptions
    constructor(options?: ReplayOptions) {
        nodeStore.reset()
        this.init(options)
    }

    private async init(options?: ReplayOptions) {
        if (!isDev) {
            logInfo()
        }
        const opts = {
            destroyStore: this.destroyStore,
            ...defaultReplayOptions,
            ...options,
            cssOptions: {
                ...defaultReplayOptions.cssOptions,
                ...options?.cssOptions
            }
        } as ReplayInternalOptions

        this.options = opts
        Store.dispatch({ type: PlayerReducerTypes.OPTIONS, data: { options: opts } })
        this.destroyStore.add(() => Store.unsubscribe())

        const records = await this.getRecords(opts)
        window.G_REPLAY_RECORDS = records

        const packs = getPacks(records)
        const firstData = transToReplayData(packs[0])
        const { audio } = firstData
        Store.dispatch({
            type: ReplayDataReducerTypes.UPDATE_DATA,
            data: { records, packs, currentData: firstData }
        })

        const hasAudio = audio && (audio.src || audio.bufferStrList.length)

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
                            type: PlayerReducerTypes.SPEED,
                            data: { speed: 1 }
                        })
                    }
                }
            }
        })

        if (packs.length) {
            this.calcProgress()
        }

        if (records.length <= 2) {
            // live mode
            Store.dispatch({ type: PlayerReducerTypes.OPTIONS, data: { options: { mode: 'live' } } })
            const panel = this.c.panel.target
            if (panel) {
                panel.setAttribute('style', 'display: none')
            }
        }
    }

    private async getRecords(options: ReplayInternalOptions) {
        const { receiver, records: recordsData } = options

        const records =
            recordsData ||
            (receiver && (await this.dataReceiver(receiver))) ||
            getGZipData() ||
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
            diffTime: number
        }[] = []
        let diffTime = 0
        packs.forEach((pack, index) => {
            const startTime = pack[0].time
            const endTime = pack.slice(-1)[0].time
            if (index) {
                diffTime += startTime - packs[index - 1].slice(-1)[0].time
            }
            const info = {
                startTime,
                endTime,
                duration: endTime - startTime,
                diffTime
            }
            packsInfo.push(info)
            duration += info.duration
        })
        const endTime = startTime + duration

        Store.dispatch({
            type: ProgressReducerTypes.PROGRESS,
            data: {
                duration,
                packsInfo,
                startTime,
                endTime
            }
        })
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

    async destroy(opts: { removeDOM: boolean } = { removeDOM: true }) {
        this.destroyStore.forEach(un => un())
        observer.destroy()
        Store.unsubscribe()
        await delay(0)
        removeGlobalVariables()
        if (opts.removeDOM) {
            const shadowHost = this.c.shadowHost
            this.c.shadowHost.parentElement?.removeChild(shadowHost)
        }
    }

    public on(key: PlayerEventTypes, fn: Function) {
        observer.on(key, fn)
    }

    public async append(records: RecordData[]) {
        await delay(0)
        Store.dispatch({
            type: ReplayDataReducerTypes.APPEND_RECORDS,
            data: { records }
        })

        this.triggerCalcProgress()
    }
}
