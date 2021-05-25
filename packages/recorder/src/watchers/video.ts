/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { RecordType, VideoRecord, VideoRecordData } from '@timecat/share'
import { bufferArrayToBase64, nodeStore, debounce, AnimationFrame } from '@timecat/utils'
import { Watcher } from '../watcher'

export class VideoWatcher extends Watcher<VideoRecord> {
    private fps: number

    protected init() {
        const recordOptions = this.recordOptions
        const { video } = recordOptions
        this.fps = (<Exclude<typeof video, boolean>>video).fps
        this.watchVideos()
    }

    private watchVideos() {
        const videoElements = document.getElementsByTagName('video')
        Array.from(videoElements).forEach(videoElement => {
            this.recordVideo(videoElement)
        })
    }

    private recordVideo(videoElement: HTMLVideoElement) {
        const canvas = this.createMirrorCanvas(videoElement)
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            return
        }

        const resizeHandle = () => {
            this.resizeCanvasSize(canvas, videoElement)
        }
        videoElement.addEventListener('resize', resizeHandle)

        function drawCanvas(videoElement: HTMLVideoElement, ctx: CanvasRenderingContext2D) {
            const canvas = ctx.canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        }

        drawCanvas(videoElement, ctx)

        const recorder = new MediaRecorder(canvas.captureStream(60), {
            mimeType: 'video/webm;codecs=vp9',
            bitsPerSecond: 600_000
        })
        recorder.ondataavailable = async e => {
            const blob = e.data
            const buffer = await blob.arrayBuffer()
            const dataStr = bufferArrayToBase64(buffer)
            const data: VideoRecordData = {
                id: nodeStore.getNodeId(videoElement)!,
                dataStr
            }
            this.emitData(RecordType.VIDEO, data)
        }

        const stopRecord = () => {
            recorder.state === 'recording' && recorder.stop()
        }

        let isRecording = false
        const drawRAF = new AnimationFrame(() => drawCanvas(videoElement, ctx), this.fps)

        const triggerDraw = debounce(
            () => {
                isRecording = !isRecording
                if (isRecording) {
                    drawRAF.start()
                    recorder.start(1000 / this.fps)
                } else {
                    drawRAF.stop()
                    stopRecord()
                }
            },
            300,
            { isTrailing: true, isImmediate: true }
        )

        videoElement.addEventListener('timeupdate', triggerDraw)
        this.uninstall(() => {
            stopRecord()
            videoElement.removeEventListener('timeupdate', triggerDraw)
            videoElement.removeEventListener('resize', resizeHandle)
        })
    }

    private createMirrorCanvas(videoElement: HTMLVideoElement) {
        const canvas = document.createElement('canvas', false) as HTMLCanvasElement
        this.resizeCanvasSize(canvas, videoElement)
        return canvas
    }

    private resizeCanvasSize(canvas: HTMLCanvasElement, el: HTMLElement) {
        const { width, height } = el.getBoundingClientRect()
        canvas.width = width
        canvas.height = height
    }
}
