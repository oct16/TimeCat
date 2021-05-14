/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { RecordType, VideoRecord, VideoRecordData } from '@timecat/share'
import { bufferArrayToBase64, getRandomCode, nodeStore } from '@timecat/utils'
import { Watcher } from '../watcher'

export class VideoWatcher extends Watcher<VideoRecord> {
    private fps: number

    protected init() {
        const recordOptions = this.recordOptions
        const { video } = recordOptions
        this.fps = video.fps
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

        const timeupdateHandle = () => {
            drawCanvas(videoElement, ctx)
        }
        videoElement.addEventListener('timeupdate', timeupdateHandle)
        this.uninstall(() => {
            videoElement.removeEventListener('timeupdate', timeupdateHandle)
        })

        const resizeHandle = () => {
            this.resizeCanvasSize(canvas, videoElement)
        }
        videoElement.addEventListener('resize', resizeHandle)
        this.uninstall(() => {
            videoElement.removeEventListener('resize', resizeHandle)
        })

        drawCanvas(videoElement, ctx)

        function drawCanvas(videoElement: HTMLVideoElement, ctx: CanvasRenderingContext2D) {
            const canvas = ctx.canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        }

        const uid = getRandomCode()
        const recorder = new MediaRecorder(canvas.captureStream(60), {
            mimeType: 'video/webm;codecs=vp9'
        })
        recorder.start(1000 / this.fps)
        recorder.ondataavailable = async e => {
            const blob = e.data
            const buffer = await blob.arrayBuffer()
            const dataStr = bufferArrayToBase64(buffer)
            const data: VideoRecordData = {
                id: nodeStore.getNodeId(videoElement)!,
                uid,
                dataStr
            }
            this.emitData(RecordType.VIDEO, data)
        }
        this.uninstall(() => {
            recorder.stop()
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
