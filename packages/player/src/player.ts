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
} from '@timecat/utils'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData, AudioData, SnapshotRecord, ReplayPack, ReplayData } from '@timecat/share'
import { BroadcasterComponent } from './broadcaster'
import { AnimationFrame } from './animation-frame'

export class PlayerComponent {
    c: ContainerComponent
    pointer: PointerComponent
    progress: ProgressComponent
    broadcaster: BroadcasterComponent
    audioNode: HTMLAudioElement

    progressState: ProgressState
    records: RecordData[]
    speed = 0
    recordIndex = 0
    frameIndex = 0
    lastPercentage = 0
    isFirstTimePlay = true
    frameInterval = 250
    frames: number[]

    startTime: number
    elapsedTime = 0
    audioOffset = 500

    curViewEndTime: number
    curViewDiffTime = 0

    subtitlesIndex = 0
    audioData: AudioData
    audioBlobUrl: string

    RAF: AnimationFrame

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

        if (!this.records.length) {
            // is live mode
            window.addEventListener('record-data', this.streamHandle.bind(this))
        } else {
            reduxStore.subscribe('player', state => {
                if (state) {
                    this.progressState = reduxStore.getState('progress')
                    const speed = state.speed
                    this.speed = speed
                    this.frames = this.getAccuratelyFrame()

                    if (speed > 0) {
                        this.play()
                    } else {
                        this.pause()
                    }

                    this.setProgress()
                }
            })
        }
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
        const frame = e.detail as RecordData
        if (isSnapshot(frame)) {
            window.__ReplayData__.snapshot = frame as SnapshotRecord
            this.c.setViewState()
            return
        }
        this.execFrame(frame as RecordData)
    }

    initViewState() {
        const { __ReplayPacks__: packs } = window
        const firstPack = packs[0] as ReplayPack
        const firstData = firstPack.body[0]
        this.records = firstData.records

        this.audioData = firstData.audio
        this.initAudio()

        // live mode
        if (!this.records.length) {
            return
        }

        this.subtitlesIndex = 0
        this.broadcaster.cleanText()

        this.curViewEndTime = +this.records.slice(-1)[0].time
        this.curViewDiffTime = 0
        window.__ReplayData__ = firstData
    }

    async switchNextView(delayTime?: number) {
        const { __ReplayData__: rData, __ReplayPacks__: packs } = window as {
            __ReplayData__: ReplayData
            __ReplayPacks__: ReplayPack[]
        }

        if (!this.records) {
            return
        }

        const nextData = getNextData(rData)

        if (!nextData) {
            return
        }

        function getNextData(curData: ReplayData) {
            for (let i = 0; i < packs.length; i++) {
                const body = packs[i].body
                const nextPackBody = packs[i + 1]?.body
                for (let j = 0; j < body.length; j++) {
                    if (curData === body[j]) {
                        const next = body[j + 1]
                        if (next) {
                            return next
                        } else if (nextPackBody.length) {
                            return nextPackBody[0]
                        }
                        return null
                    }
                }
            }
            return null
        }

        const curEndTime = +this.records.slice(-1)[0].time
        const nextStartTime = +nextData.records[0].time
        this.curViewDiffTime += nextStartTime - curEndTime

        window.__ReplayData__ = nextData
        this.records = nextData.records
        this.audioData = nextData.audio
        this.initAudio()
        this.curViewEndTime = +this.records.slice(-1)[0].time
        this.recordIndex = 0

        if (delayTime) {
            await delay(delayTime)
        }

        this.c.setViewState()
    }

    play() {
        this.playAudio()
        if (this.recordIndex === 0) {
            this.progress.resetThumb()
            if (!this.isFirstTimePlay) {
                // Indicates the second times play
                this.initViewState()
                this.c.setViewState()
            }
            this.isFirstTimePlay = false
        }

        if (this.RAF && this.RAF.requestID) {
            this.RAF.stop()
        }

        const maxFps = 30
        this.RAF = new AnimationFrame(loop.bind(this), maxFps)
        this.RAF.start()

        const initTime = getTime()
        this.startTime = 0

        async function loop(this: PlayerComponent, t: number, loopIndex: number) {
            const timeStamp = getTime() - initTime
            if (this.frameIndex > 0 && !this.frames[this.frameIndex]) {
                this.stop()
                return
            }
            if (!this.startTime) {
                this.startTime = Number(this.frames[this.frameIndex])
            }

            const currTime = this.startTime + timeStamp * this.speed
            let nextTime = Number(this.frames[this.frameIndex])

            if (nextTime > this.curViewEndTime - this.curViewDiffTime) {
                // delay 200ms wait for all frame finished and switch next
                await this.switchNextView(200)
            }

            while (nextTime && currTime >= nextTime) {
                this.renderEachFrame()
                this.frameIndex++
                nextTime = Number(this.frames[this.frameIndex])
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
        this.progress.updateTimer(((this.frameIndex + 1) * this.frameInterval) / 1000)

        let data: RecordData
        while (
            this.recordIndex < this.records.length &&
            +(data = this.records[this.recordIndex]).time - this.curViewDiffTime <= this.frames[this.frameIndex]
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
        this.recordIndex = 0
        this.frameIndex = 0
        this.lastPercentage = 0
        this.elapsedTime = 0 // unit: sec
        this.pause()

        this.audioNode.currentTime = 0
    }

    execFrame(this: PlayerComponent, record: RecordData) {
        setTimeout(() => updateDom.call(this, record), 0)
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
