import { PointerComponent } from './pointer'
import { updateDom } from '../dom'
import { getTime, isSnapshot, toTimeStamp, base64ToFloat32Array, encodeWAV, delay } from '@timecat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData, AudioData, SnapshotRecord, ReplayInternalOptions, RecordType } from '@timecat/share'
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
    normalLoading
} from '../utils'

@Component(
    'timecat-player',
    html`<div class="timecat-player">
        <iframe class="player-sandbox" sandbox="allow-same-origin allow-scripts allow-popups"></iframe>
    </div>`
)
export class PlayerComponent {
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
    frameInterval = 250
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
    watchPlayerSpeed(state?: { speed: number }) {
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
        this.setProgress()
    }

    @ConnectProps(state => ({
        endTime: state.progress.endTime
    }))
    watchProgress() {
        this.recalculateProgress()
        this.viewsLength = Store.getState().replayData.packs.length
    }

    watcherProgressJump() {
        observer.on(
            PlayerEventTypes.JUMP,
            (state: { time: number; index: number; recordIndex: number; percent: number }) => {
                if (this.isJumping) {
                    return
                }
                this.jump(state, true)
            }
        )
    }

    async init() {
        this.audioNode = new Audio()
        this.frames = this.calcFrames()
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

        observer.on(PlayerEventTypes.RESIZE, this.resizeHeatBar.bind(this))
    }

    initAudio() {
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

    streamHandle(this: PlayerComponent, e: CustomEvent) {
        const record = e.detail as RecordData
        if (isSnapshot(record)) {
            Store.getState().replayData.currentData.snapshot = record as SnapshotRecord
            this.c.setViewState()
            return
        }
        this.execFrame(record as RecordData)
    }

    initViewState() {
        const { currentData } = Store.getState().replayData
        const firstData = currentData
        this.records = this.orderRecords(firstData.records)
        this.audioData = firstData.audio
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

    async jump(state: { index: number; time: number; percent?: number }, shouldLoading = false) {
        this.isJumping = true
        let loading: HTMLElement | undefined = undefined
        const { index, time, percent } = state

        if (shouldLoading) {
            const temp = document.createElement('div')
            temp.innerHTML = normalLoading
            loading = temp.firstElementChild as HTMLElement
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

        const frameIndex = this.frames.findIndex((t, i) => {
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
        this.startTime = time - this.animationDelayTime

        if (percent !== undefined) {
            this.setProgress()
            this.progress.moveThumb(percent)
        }

        this.c.setViewState()
        this.loopFramesByTime(this.startTime + this.frameInterval)

        if (loading) {
            await delay(300)
            this.c.container.removeChild(loading)
        }

        this.isJumping = false
    }

    getNextReplayData(index: number) {
        const { packs } = Store.getState().replayData

        const nextPack = packs[index]
        if (nextPack) {
            const nextData = transToReplayData(nextPack)
            Store.dispatch({ type: ReplayDataReducerTypes.UPDATE_DATA, data: { currentData: nextData } })
            return nextData
        }
        return null
    }

    loopFramesByTime(currTime: number) {
        let nextTime = this.frames[this.frameIndex]

        while (nextTime && currTime >= nextTime) {
            observer.emit(PlayerEventTypes.PROGRESS, this.frameIndex, this.frames.length - 1)
            this.frameIndex++
            this.renderEachFrame()
            nextTime = this.frames[this.frameIndex]
        }
        return nextTime
    }

    play() {
        this.playAudio()
        if (this.frameIndex === 0) {
            this.progress.resetThumb()
            if (!this.isFirstTimePlay) {
                // Indicates the second times play
                this.getNextReplayData(0)
                this.initViewState()
                this.c.setViewState()
            } else {
                this.progress.drawHeatPoints()
            }
            this.isFirstTimePlay = false
        }

        if (this.RAF && this.RAF.requestID) {
            this.RAF.stop()
        }

        const maxFps = 30
        this.RAF = new AnimationFrame(loop.bind(this), maxFps)
        this.options.destroyStore.add(() => this.RAF.stop())
        this.RAF.start()

        this.initTime = getTime()
        this.startTime = this.frames[this.frameIndex] - this.animationDelayTime

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

    playAudio() {
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

    syncAudioCurrentTime(elapsedTime: number = this.elapsedTime, offset: number = this.audioOffset / 1000) {
        this.audioNode.currentTime = elapsedTime + offset
    }

    pauseAudio() {
        if (this.audioNode) {
            this.audioNode.pause()
        }
    }

    setProgress() {
        this.progress.setProgressAnimation(this.frameIndex, this.frames.length, this.frameInterval, this.speed)
    }

    renderEachFrame() {
        this.progress.updateTimer(this.frameIndex, this.frameInterval, this.curViewDiffTime)

        let data: RecordData
        while (
            this.recordIndex < this.records.length &&
            (data = this.records[this.recordIndex]).time - this.curViewDiffTime <= this.frames[this.frameIndex]
        ) {
            this.execFrame.call(this, data)
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

    pause() {
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
        observer.emit(PlayerEventTypes.PAUSE)
    }

    stop() {
        this.speed = 0
        this.recordIndex = 0
        this.frameIndex = 0
        this.elapsedTime = 0 // unit: sec
        this.pause()
        this.audioNode.currentTime = 0
        observer.emit(PlayerEventTypes.STOP)
    }

    execFrame(record: RecordData) {
        const isJumping = this.isJumping
        updateDom.call(this, record, { isJumping })
    }

    calcFrames(interval = this.frameInterval) {
        if (this.options.mode === 'live') {
            return []
        }

        const { startTime, endTime } = Store.getState().progress
        const result: number[] = []
        for (let i = startTime; i < endTime + interval; i += interval) {
            result.push(i)
        }
        result.push(endTime)
        return result
    }

    calcHeatPointsData() {
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
            const counts: number[] = []
            let index = 0
            let step = 0
            const endTime = records.slice(-1)[0].time
            let currentTime = records[0].time

            while (currentTime < endTime && index < records.length) {
                const nextTime = currentTime + gap
                if (records[index].time < nextTime) {
                    index++
                    step++
                    continue
                }
                counts.push(step)
                step = 0
                currentTime += gap
            }
            acc.push(...counts)
            return acc
        }, [] as number[])

        return heatPoints
    }

    orderRecords(records: RecordData[]) {
        if (!records.length) {
            return []
        }
        // Lift font records for canvas render
        let insertIndex = 1
        const startTime = records[0].time
        for (let i = 0; i < records.length; i++) {
            const record = records[i]
            if (record.type === RecordType.FONT) {
                const fontRecord = records.splice(i, 1)[0]
                fontRecord.time = startTime + insertIndex
                records.splice(insertIndex++, 0, fontRecord)
            }
        }

        return records
    }

    recalculateProgress() {
        this.frames = this.calcFrames()
        this.progress.drawHeatPoints(this.calcHeatPointsData())
        this.setProgress()
    }

    async resizeHeatBar() {
        // wait for scaling page finish to get target offsetWidth
        await delay(500)
        this.progress.drawHeatPoints(this.calcHeatPointsData())
    }
}
