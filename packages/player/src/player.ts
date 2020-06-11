import { PointerComponent } from './pointer'
import { updateDom } from './dom'
import {
    reduxStore,
    PlayerTypes,
    ProgressState,
    getTime,
    isSnapshot,
    delay,
    toTimeStamp,
    base64ToFloat32Array,
    encodeWAV
} from '@TimeCat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData, AudioData } from '@TimeCat/record'
import { BroadcasterComponent } from './broadcaster'

export class PlayerComponent {
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    broadcaster: BroadcasterComponent
    audioNode: HTMLAudioElement

    progressState: ProgressState
    data: RecordData[]
    speed = 0
    index = 0
    frameIndex = 0
    lastPercentage = 0
    isFirstTimePlay = true
    frameInterval = 250
    frames: number[]
    requestID: number
    startTime: number
    elapsedTime = 0

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
        if (!this.audioData) {
            return
        }

        if (this.audioData.src) {
            this.audioBlobUrl =
                location.href
                    .split('/')
                    .slice(0, -1)
                    .join('/') +
                '/' +
                this.audioData.src
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
                this.frameIndex++
            }

            this.elapsedTime = (currTime - this.frames[0]) / 1000 - Math.max(0, (currTime - nextTime) / 1000)

            this.requestID = requestAnimationFrame(loop.bind(this))
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

            this.audioNode.currentTime = this.elapsedTime + 0.5

            if (this.speed > 1) {
                this.audioNode.pause()
            } else {
                this.audioNode.play()
            }
        }
    }

    pauseAudio() {
        if (this.audioNode) {
            this.audioNode.pause()
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
        this.elapsedTime = 0 // unit: sec
        this.pause()

        this.audioNode.currentTime = 0
    }

    execFrame(this: PlayerComponent, record: RecordData) {
        updateDom.call(this, record)
    }

    getPercentInterval() {
        const k = 0.08
        const b = 0.2
        return this.speed * k + b
    }

    getAccuratelyFrame(interval = this.frameInterval) {
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
