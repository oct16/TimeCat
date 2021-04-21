/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PointerComponent } from './pointer'
import { renderAll } from '../render'
import { getTime, isSnapshot, toTimeStamp, base64ToFloat32Array, encodeWAV, delay } from '@timecat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData, AudioData, SnapshotRecord, ReplayInternalOptions, ReplayData } from '@timecat/share'
import { BroadcasterComponent } from './broadcaster'
import { AnimationFrame } from '../animation-frame'
import { PlayerEventTypes } from '../types'
import {
    Component,
    html,
    Store,
    PlayerReducerTypes,
    ReplayDataReducerTypes,
    ConnectProps,
    observer,
    transToReplayData,
    normalLoading,
    parseHtmlStr,
    isMobile,
    IComponent
} from '../utils'

@Component(
    'timecat-player',
    html`<div class="timecat-player">
        <iframe
            class="player-sandbox"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
    </div>`
)
export class PlayerComponent implements IComponent {
    target: HTMLElement
    parent: HTMLElement
    options: ReplayInternalOptions
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    broadcaster: BroadcasterComponent
    audioNode: HTMLAudioElement

    records: RecordData[]
    speed = 0
    recordIndex = 0
    frameIndex = 0
    isFirstTimePlay = true
    frameInterval: number
    maxFrameInterval = 250
    frames: number[]

    initTime: number
    startTime: number
    animationDelayTime = 300
    elapsedTime = 0
    audioOffset = 500

    curViewEndTime: number
    curViewDiffTime = 0
    viewIndex = 0
    viewsLength: number

    subtitlesIndex = 0
    audioData: AudioData
    audioBlobUrl: string

    RAF: AnimationFrame
    isJumping: boolean

    maxIntensityStep = 8

    constructor(
        options: ReplayInternalOptions,
        c: ContainerComponent,
        pointer: PointerComponent,
        progress: ProgressComponent,
        broadcaster: BroadcasterComponent
    ) {
        this.options = options
        this.c = c
        this.pointer = pointer
        this.progress = progress
        this.broadcaster = broadcaster
        this.init()
    }

    @ConnectProps(state => ({
        speed: state.player.speed
    }))
    private watchPlayerSpeed(state?: { speed: number }) {
        if (state) {
            const speed = state.speed
            const curSpeed = this.speed
            this.speed = speed

            observer.emit(PlayerEventTypes.SPEED, speed)

            if (speed > 0) {
                this.play()
                if (curSpeed === 0) {
                    observer.emit(PlayerEventTypes.PLAY)
                }
            } else {
                this.pause()
            }
        }
    }

    @ConnectProps(state => ({
        endTime: state.progress.endTime
    }))
    private watchProgress() {
        this.recalculateProgress()
        this.viewsLength = Store.getState().replayData.packs.length
    }

    private watcherProgressJump() {
        observer.on(PlayerEventTypes.JUMP, async (state: { index: number; time: number; percent?: number }) =>
            this.jump(state, true)
        )
    }

    private async init() {
        this.audioNode = new Audio()
        this.calcFrames()
        this.viewsLength = Store.getState().replayData.packs.length
        this.initViewState()

        if (this.records.length <= 2) {
            // is live mode
            window.addEventListener('record-data', this.streamHandle.bind(this))
            this.options.destroyStore.add(() => window.removeEventListener('record-data', this.streamHandle.bind(this)))
        } else {
            this.watchProgress()
            this.watchPlayerSpeed()
            this.watcherProgressJump()
        }

        observer.on(PlayerEventTypes.RESIZE, async () => {
            // wait for scaling page finish to get target offsetWidth
            await delay(500)
            this.recalculateProgress()
        })

        observer.on(PlayerEventTypes.PROGRESS, (frame: number) => {
            const percent = frame / (this.frames.length - 1)
            this.progress.setProgressPosition(percent)
        })
    }

    private initAudio() {
        if (!this.audioData) {
            return
        }

        if (this.audioData.src) {
            this.audioBlobUrl = location.href.split('/').slice(0, -1).join('/') + '/' + this.audioData.src
        } else {
            const bufferStrList = this.audioData.bufferStrList
            if (!bufferStrList.length) {
                return
            }

            const dataArray: Float32Array[] = []
            for (let i = 0; i < bufferStrList.length; i++) {
                const data = base64ToFloat32Array(bufferStrList[i])
                dataArray.push(data)
            }

            const audioBlob = encodeWAV(dataArray, this.audioData.opts)
            const audioBlobUrl = URL.createObjectURL(audioBlob)
            this.audioBlobUrl = audioBlobUrl
        }
    }

    private streamHandle(this: PlayerComponent, e: CustomEvent) {
        const record = e.detail as RecordData
        if (isSnapshot(record)) {
            Store.getState().replayData.currentData.snapshot = record as SnapshotRecord
            this.c.setViewState()
            return
        }
        this.execFrame(record as RecordData)
    }

    private initViewState() {
        const { currentData } = Store.getState().replayData
        const { records, audio, head } = currentData
        this.records = this.orderRecords(records)
        this.audioData = audio
        const { userAgent } = head?.data || {}
        if (isMobile(userAgent as string)) {
            this.pointer.hidePointer()
        }
        this.initAudio()

        // live mode
        if (!this.records.length) {
            return
        }

        this.subtitlesIndex = 0
        this.broadcaster.cleanText()

        this.curViewEndTime = this.records.slice(-1)[0].time
        this.curViewDiffTime = 0
        this.viewIndex = 0
    }

    private async jump(state: { index: number; time: number; percent?: number }, shouldLoading = false) {
        this.isJumping = true
        let loading: HTMLElement | undefined = undefined
        const { speed } = Store.getState().player
        const { index, time, percent } = state

        if (shouldLoading) {
            this.pause(false)
            loading = parseHtmlStr(normalLoading)[0]
            this.c.container.appendChild(loading)
            await delay(100)
        }

        const nextReplayData = this.getNextReplayData(index)
        if (!nextReplayData) {
            return
        }

        if (this.viewIndex !== index || this.startTime >= time) {
            const [{ packsInfo }, { packs }] = [Store.getState().progress, Store.getState().replayData]

            const diffTime = packsInfo[index].diffTime
            this.curViewEndTime = packs[index].slice(-1)[0].time
            this.curViewDiffTime = diffTime
            this.viewIndex = index
            this.records = packs[index]
        }

        const frameIndex =
            1 +
            this.frames.findIndex((t, i) => {
                const cur = t
                const next = this.frames[i + 1] || cur + 1
                if (time >= cur && time <= next) {
                    return true
                }
            })

        this.frameIndex = frameIndex
        this.initTime = getTime()
        this.recordIndex = 0
        this.audioData = nextReplayData.audio
        this.initAudio()
        this.startTime = time

        if (percent !== undefined) {
            this.progress.moveThumb(percent)
            await delay(100)
        }

        this.c.setViewState()
        this.loopFramesByTime(this.frames[this.frameIndex])

        if (loading) {
            await delay(100)
            this.c.container.removeChild(loading)
            Store.dispatch({ type: PlayerReducerTypes.SPEED, data: { speed } })
        }

        this.isJumping = false
    }

    private getNextReplayData(index: number): ReplayData | null {
        const { packs } = Store.getState().replayData

        const nextPack = packs[index]
        if (nextPack) {
            const nextData = transToReplayData(nextPack)
            Store.dispatch({ type: ReplayDataReducerTypes.UPDATE_DATA, data: { currentData: nextData } })
            return nextData
        }
        return null
    }

    private loopFramesByTime(currTime: number, isJumping = false) {
        let nextTime = this.frames[this.frameIndex]

        while (nextTime && currTime >= nextTime) {
            if (!isJumping) {
                observer.emit(PlayerEventTypes.PROGRESS, this.frameIndex, this.frames.length - 1)
            }
            this.frameIndex++
            this.renderEachFrame()
            nextTime = this.frames[this.frameIndex]
        }
        return nextTime
    }

    private play() {
        this.playAudio()
        if (this.frameIndex === 0) {
            this.progress.moveThumb()
            if (!this.isFirstTimePlay) {
                this.getNextReplayData(0)
                this.initViewState()
                this.c.setViewState()
            } else {
                this.progress.drawHeatPoints()
            }
        }
        this.isFirstTimePlay = false

        if (this.RAF && this.RAF.requestID) {
            this.RAF.stop()
        }

        const maxFps = 30
        this.RAF = new AnimationFrame(loop.bind(this), maxFps)
        this.options.destroyStore.add(() => this.RAF.stop())
        this.RAF.start()

        this.initTime = getTime()
        this.startTime = this.frames[this.frameIndex]

        async function loop(this: PlayerComponent, t: number, loopIndex: number) {
            const timeStamp = getTime() - this.initTime
            if (this.frameIndex > 0 && this.frameIndex >= this.frames.length) {
                this.stop()
                return
            }

            const currTime = this.startTime + timeStamp * this.speed
            const nextTime = this.loopFramesByTime(currTime)

            if (nextTime > this.curViewEndTime - this.curViewDiffTime && this.viewIndex < this.viewsLength - 1) {
                const { packsInfo } = Store.getState().progress
                const index = this.viewIndex + 1
                const { startTime, diffTime } = packsInfo[index]
                this.jump({ index: index, time: startTime - diffTime })
            }

            this.elapsedTime = (currTime - this.frames[0]) / 1000

            // sync audio time
            // every 2s check once

            const frameCount = Math.floor(2 / (this.frameInterval / 1000))
            const checkInterval = !(this.frameIndex % frameCount)

            const shouldCheckAudioTime = this.audioNode.src && checkInterval && !((loopIndex % frameCount) * 2)

            if (shouldCheckAudioTime) {
                const allowDiff = 200
                if (Math.abs((this.elapsedTime - this.audioNode.currentTime) * 1000) > this.audioOffset + allowDiff) {
                    this.syncAudioCurrentTime()
                }
            }
        }
    }

    private playAudio() {
        if (!this.audioData) {
            return
        }
        if (!this.audioBlobUrl) {
            this.pauseAudio()
            return
        }

        if (this.audioNode) {
            if (!this.audioNode.src || this.audioNode.src !== this.audioBlobUrl) {
                this.audioNode.src = this.audioBlobUrl
            }

            this.syncAudioCurrentTime()

            if (this.speed > 1) {
                this.audioNode.pause()
            } else {
                this.audioNode.play()
            }
        }
    }

    private syncAudioCurrentTime(elapsedTime: number = this.elapsedTime, offset: number = this.audioOffset / 1000) {
        this.audioNode.currentTime = elapsedTime + offset
    }

    private pauseAudio() {
        if (this.audioNode) {
            this.audioNode.pause()
        }
    }

    private renderEachFrame() {
        this.progress.updateTimer(this.frameIndex, this.frameInterval, this.curViewDiffTime)

        let data: RecordData
        while (
            this.recordIndex < this.records.length &&
            (data = this.records[this.recordIndex]).time - this.curViewDiffTime <= this.frames[this.frameIndex]
        ) {
            this.execFrame(data)
            this.recordIndex++
        }

        if (this.audioData && this.audioData.subtitles.length) {
            const subtitles = this.audioData.subtitles
            const { start, end, text } = subtitles[this.subtitlesIndex]
            const audioStartTime = toTimeStamp(start)
            const audioEndTime = toTimeStamp(end)

            if (this.elapsedTime > audioEndTime / 1000) {
                this.broadcaster.cleanText()
                if (this.subtitlesIndex < subtitles.length - 1) {
                    this.subtitlesIndex++
                }
            } else if (this.elapsedTime > audioStartTime / 1000) {
                this.broadcaster.updateText(text)
            }
        }
    }

    private pause(emit = true) {
        if (this.RAF) {
            this.RAF.stop()
        }
        Store.dispatch({
            type: PlayerReducerTypes.SPEED,
            data: {
                speed: 0
            }
        })
        this.pauseAudio()
        if (emit) {
            observer.emit(PlayerEventTypes.PAUSE)
        }
    }

    private stop() {
        this.speed = 0
        this.recordIndex = 0
        this.frameIndex = 0
        this.elapsedTime = 0 // unit: sec
        this.pause()
        this.audioNode.currentTime = 0
        observer.emit(PlayerEventTypes.STOP)
    }

    private execFrame(record: RecordData) {
        const { isJumping, speed } = this
        renderAll.call(this, record, { isJumping, speed })
    }

    private calcFrames(maxInterval = this.maxFrameInterval) {
        if (this.options.mode === 'live') {
            return []
        }
        const preTime = this.frames && this.frames[this.frameIndex]
        const { duration, startTime, endTime } = Store.getState().progress
        this.frameInterval = Math.max(20, Math.min(maxInterval, (duration / 60 / 1000) * 60 - 40))
        const interval = this.frameInterval
        const frames: number[] = []
        let nextFrameIndex: number | undefined
        for (let i = startTime; i < endTime + interval; i += interval) {
            frames.push(i)
            if (!nextFrameIndex && preTime && i >= preTime) {
                nextFrameIndex = frames.length - 1
            }
        }
        frames.push(endTime)
        if (nextFrameIndex) {
            this.frameIndex = nextFrameIndex!
        }
        this.frames = frames
    }

    private calcHeatPointsData() {
        const frames = this.frames
        if (!frames.length || !this.options.heatPoints) {
            return []
        }
        const state = Store.getState()
        const { packs } = state.replayData
        const { duration } = state.progress
        const sliderWidth = this.progress.slider.offsetWidth
        const column = Math.floor(sliderWidth / 7)
        const gap = duration / column

        const heatPoints = packs.reduce((acc, records) => {
            let index = 0
            let step = 0
            let snapshot = false

            const endTime = records.slice(-1)[0].time
            let currentTime = records[0].time

            while (currentTime < endTime && index < records.length) {
                const nextTime = currentTime + gap
                const record = records[index]
                if (record.time < nextTime) {
                    index++
                    step++
                    if (isSnapshot(record)) {
                        snapshot = true
                    }
                    continue
                }
                acc.push({ step, snapshot })
                step = 0
                snapshot = false
                currentTime += gap
            }

            return acc
        }, [] as { step: number; snapshot: boolean }[])

        return heatPoints
    }

    // Lift Patch Record
    private orderRecords(records: RecordData[]) {
        if (!records.length) {
            return []
        }

        records.sort((a: RecordData, b: RecordData) => {
            return a.time - b.time
        })

        return records
    }

    private recalculateProgress() {
        this.calcFrames()
        this.progress.drawHeatPoints(this.calcHeatPointsData())
    }
}
