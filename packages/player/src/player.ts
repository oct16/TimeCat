import { PointerComponent } from './pointer'
import { updateDom } from './dom'
import { reduxStore, PlayerTypes, ProgressState, getTime, isSnapshot, delay, toTimeStamp } from '@TimeCat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData, AudioData, base64ToFloat32Array, encodeWAV } from '@TimeCat/record'
import { BroadcasterComponent } from './broadcaster'

export class PlayerComponent {
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    broadcaster: BroadcasterComponent
    audioNode: HTMLAudioElement
    audioCurrentTime = 0

    progressState: ProgressState
    data: RecordData[]
    speed = 0
    index = 0
    frameIndex = 0
    lastPercentage = 0
    isFirstTimePlay = true
    frames: number[]
    requestID: number
    startTime: number

    curViewEndTime: number
    curViewDiffTime = 0

    subtitlesIndex = 0
    audioData: AudioData
    audioBlobUrl: string

    constructor(
        c: ContainerComponent,
        pointer: PointerComponent,
        progress: ProgressComponent,
        broadcaster: BroadcasterComponent
    ) {
        this.c = c
        this.pointer = pointer
        this.progress = progress
        this.broadcaster = broadcaster
        this.audioNode = new Audio()

        this.initViewState()

        if (!this.data.length) {
            // is live mode
            window.addEventListener('record-data', this.streamHandle.bind(this))
        } else {
            reduxStore.subscribe('player', state => {
                this.progressState = reduxStore.getState()['progress']
                const speed = state.speed
                this.speed = speed
                if (speed > 0) {
                    this.play()
                } else {
                    this.pause()
                }
                this.frames = this.getAccuratelyFrame()
            })
        }
    }

    initAudio() {
        if (!this.audioData || !this.audioData.audioBase64DataArray.length) {
            return
        }

        const arrayData = this.audioData.audioBase64DataArray

        const f32ArrayData: Float32Array[] = []
        for (let i = 0; i < arrayData.length; i++) {
            const f32 = base64ToFloat32Array(arrayData[i])
            f32ArrayData.push(f32)
        }

        const audioBlob = encodeWAV(f32ArrayData, {
            sampleBits: 16,
            sampleRate: 44100,
            channelCount: 1,
            bufferSize: 256
        })
        const audioBlobUrl = URL.createObjectURL(audioBlob)
        this.audioBlobUrl = audioBlobUrl
    }

    streamHandle(this: PlayerComponent, e: CustomEvent) {
        const frame = e.detail as RecordData
        if (isSnapshot(frame)) {
            window.__ReplayData__.snapshot = frame
            this.c.setViewState()
            return
        }
        this.execFrame(frame)
    }

    initViewState() {
        const { __ReplayDataList__: list } = window
        const firstData = list[0]
        this.data = firstData.records

        this.audioData = firstData.audio
        this.initAudio()

        // live mode
        if (!this.data.length) {
            return
        }

        this.subtitlesIndex = 0
        this.broadcaster.cleanText()

        this.curViewEndTime = +this.data.slice(-1)[0].time
        this.curViewDiffTime = 0
        window.__ReplayData__ = { index: 0, ...firstData }
    }

    switchNextView() {
        const { __ReplayData__: rData, __ReplayDataList__: list } = window

        if (!this.data) {
            return
        }

        const nextIndex = rData.index + 1
        if (nextIndex > list.length - 1) {
            return
        }

        const nextData = list[nextIndex]

        const curEndTime = +this.data.slice(-1)[0].time
        const nextStartTime = +nextData.records[0].time
        this.curViewDiffTime += nextStartTime - curEndTime

        window.__ReplayData__ = { index: nextIndex, ...nextData }
        this.data = nextData.records
        this.audioData = nextData.audio
        this.initAudio()
        this.curViewEndTime = +this.data.slice(-1)[0].time
        this.index = 0
        this.c.setViewState()
    }

    play() {
        this.playAudio()
        if (this.index === 0) {
            this.progress.resetThumb()
            if (!this.isFirstTimePlay) {
                // Indicates the second times play
                this.initViewState()
                this.c.setViewState()
            }
            this.isFirstTimePlay = false
        }
        cancelAnimationFrame(this.requestID)
        this.requestID = requestAnimationFrame(loop.bind(this))

        const initTime = getTime()
        this.startTime = 0

        async function loop(this: PlayerComponent) {
            const timeStamp = getTime() - initTime
            if (this.frameIndex > 0 && !this.frames[this.frameIndex]) {
                this.stop()
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.frames[this.frameIndex])
            }

            const currTime = this.startTime + timeStamp * this.speed
            const nextTime = Number(this.frames[this.frameIndex])

            if (nextTime > this.curViewEndTime - this.curViewDiffTime) {
                // why delay 200ms here? cause we need to wait for all frame finished
                await delay(200)

                this.switchNextView()
            }

            if (currTime >= nextTime) {
                this.renderEachFrame(currTime)
            }

            this.requestID = requestAnimationFrame(loop.bind(this))
        }
    }

    playAudio() {
        if (!this.audioData || !this.audioData.audioBase64DataArray.length) {
            return
        }

        if (!this.audioBlobUrl) {
            this.pauseAudio()
        }
        if (this.audioNode) {
            this.audioNode.src = this.audioBlobUrl
            if (this.audioCurrentTime) {
                this.audioNode.currentTime = this.audioCurrentTime
            }
            this.audioNode.play()
        }
    }

    pauseAudio() {
        if (this.audioNode) {
            this.audioNode.pause()
            this.audioCurrentTime = this.audioNode.currentTime
        }
    }

    renderEachFrame(time: number) {
        const { startTime } = this.progressState
        this.progress.updateTimer((time - startTime) / 1000)
        const progress = (this.frameIndex / (this.frames.length - 1)) * 100
        this.progress.updateProgress(progress)
        let data: RecordData

        while (+(data = this.data[this.index]).time - this.curViewDiffTime <= this.frames[this.frameIndex]) {
            this.execFrame.call(this, data)
            this.index++
            if (this.index === this.data.length) {
                break
            }
        }

        if (this.audioData && this.audioData.subtitles.length) {
            const subtitles = this.audioData.subtitles
            const cur = this.frames[this.frameIndex] - this.startTime
            const { start, end, text } = subtitles[this.subtitlesIndex]
            const audioStartTime = toTimeStamp(start)
            const audioEndTime = toTimeStamp(end)
            if (cur > audioEndTime) {
                this.broadcaster.cleanText()
                this.subtitlesIndex++
            } else if (cur > audioStartTime) {
                this.broadcaster.updateText(text)
            }
        }

        this.frameIndex++
    }

    pause() {
        cancelAnimationFrame(this.requestID)
        reduxStore.dispatch({
            type: PlayerTypes.SPEED,
            data: {
                speed: 0
            }
        })
        this.pauseAudio()
    }

    stop() {
        this.speed = 0
        this.index = 0
        this.frameIndex = 0
        this.lastPercentage = 0
        this.pause()

        this.audioCurrentTime = 0
    }

    execFrame(this: PlayerComponent, record: RecordData) {
        updateDom.call(this, record)
    }

    getPercentInterval() {
        const k = 0.08
        const b = 0.2
        return this.speed * k + b
    }

    getAccuratelyFrame(interval = 250) {
        this.progressState = reduxStore.getState()['progress']
        const { startTime, endTime } = this.progressState

        const s = +startTime
        const e = +endTime

        const result: number[] = []

        for (let i = s; i < e; i += interval) {
            result.push(i)
        }
        result.push(e)
        return result
    }
}
