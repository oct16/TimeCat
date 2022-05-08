/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    RecordData,
    ReplayData,
    RecordType,
    SnapshotRecord,
    AudioOptionsData,
    DBRecordData,
    AudioRecord,
    HeadRecord,
    AudioStrList,
    AudioData,
    AudioOptions,
    VideoData,
    VideoRecord
} from '@timecat/share'
import { decompressWithGzipByte } from 'brick.json/gzip/esm'
import { delay, idb, asciiToUint8Array, base64ToBufferArray } from '@timecat/utils'
import { Store } from './redux'
import mobile from 'is-mobile'
import { ContainerComponent } from '../components/container'
import FIXED_CSS from '../fixed.less'
import { convertVNode } from '@timecat/virtual-dom'

export function download(src: Blob | string, name: string) {
    const tag = document.createElement('a')
    tag.download = name
    if (typeof src === 'string') {
        tag.href = src
        tag.click()
    } else {
        tag.href = URL.createObjectURL(src)
        tag.click()
        URL.revokeObjectURL(tag.href)
    }
}

export function transToReplayData(records: RecordData[]): ReplayData {
    function isAudioPCMStr(record: AudioStrList) {
        return record.type === 'pcm' && record.encode === 'base64'
    }
    function isAudioWAVStr(record: AudioStrList) {
        return record.type === 'wav' && record.encode === 'base64'
    }

    const audio = {
        src: '',
        pcmStrList: [],
        wavStrList: [],
        subtitles: [],
        opts: {} as AudioOptionsData
    }

    const replayData: ReplayData = {
        head: {} as HeadRecord,
        snapshot: {} as SnapshotRecord,
        records: [],
        audio,
        videos: [] as VideoData[]
    }

    const videosMap = new Map<number, VideoData & { bufferStrList: string[] }>()

    records.forEach((record, index) => {
        const next = records[index + 1]

        if (record.type === RecordType.HEAD) {
            if (next && !(next.data as SnapshotRecord['data']).frameId) {
                replayData.head = record
            }
        } else if (record.type === RecordType.SNAPSHOT) {
            if (!record.data.frameId) {
                if (replayData) {
                    replayData.snapshot = record
                }
            } else {
                replayData.records.push(record)
            }
        } else {
            switch (record.type) {
                case RecordType.AUDIO:
                    const { data: audioData } = record as AudioRecord
                    if ((audioData as AudioData).src) {
                        const data = audioData as AudioData
                        replayData.audio.src = data.src
                        replayData.audio.subtitles = data.subtitles
                    } else if (isAudioPCMStr(audioData as AudioStrList)) {
                        replayData.audio.pcmStrList.push(...(audioData as AudioStrList).data)
                    } else if (isAudioWAVStr(audioData as AudioStrList)) {
                        replayData.audio.wavStrList.push(...(audioData as AudioStrList).data)
                    } else {
                        replayData.audio.opts = (audioData as AudioOptions).data
                    }
                    replayData.records.push(record as RecordData)
                    break
                case RecordType.VIDEO:
                    const { data, time } = record as VideoRecord
                    const { id, dataStr } = data

                    if (!dataStr) {
                        break
                    }

                    const videoData = videosMap.get(id)
                    if (videoData) {
                        videoData.bufferStrList.push(dataStr)
                        videoData.endTime = time
                    } else {
                        const newVideoData = {
                            id,
                            startTime: time,
                            endTime: time,
                            bufferStrList: [dataStr]
                        } as VideoData & { bufferStrList: string[] }
                        videosMap.set(id, newVideoData)
                    }
                    replayData.records.push(record as RecordData)
                    break
            }
            if (replayData) {
                replayData.records.push(record as RecordData)
            }
        }
    })

    if (videosMap.size) {
        const videos = Array.from(videosMap.entries()).map(([, video]) => {
            const { bufferStrList, startTime, endTime, id } = video

            const chunks = bufferStrList.map(str => {
                const buffer = base64ToBufferArray(str)
                const blob = new Blob([buffer], { type: 'video/webm;codecs=vp9' })
                return blob
            })

            const steam = new Blob(chunks, { type: 'video/webm' })
            const blobUrl = window.URL.createObjectURL(steam)

            return {
                id,
                src: blobUrl,
                startTime,
                endTime
            } as VideoData
        })
        replayData.videos.push(...videos)
    }

    return replayData
}

export function getGZipData(): RecordData[] | null {
    const str = window.G_REPLAY_STR_RECORDS
    if (!str) {
        return null
    }

    const byteArray = asciiToUint8Array(str)

    return decompressWithGzipByte(byteArray) as RecordData[]
}

export function getRecordsFromStore() {
    const records = Store.getState().replayData.records
    return records.length ? records : null
}

export async function getRecordsFromDB() {
    const records: DBRecordData[] | null = await idb.readAll()
    if (records && records.length) {
        return records
    }
    return null
}

export function parseHtmlStr(htmlStr: string) {
    const parser = new DOMParser()
    const children = parser.parseFromString(htmlStr, 'text/html').body.children
    return [...children] as HTMLElement[]
}

export function isMobile(ua?: string) {
    if (!ua) {
        return false
    }

    return mobile({ ua })
}

export function showStartMask(c: ContainerComponent) {
    const startPage = c.container.querySelector('.player-start-page')! as HTMLElement
    startPage.setAttribute('style', '')
}

function showStartBtn(el: HTMLElement) {
    const startPage = el.querySelector('.player-start-page')! as HTMLElement
    const btn = startPage.querySelector('.play-btn') as HTMLElement
    btn.classList.add('show')
    return btn
}

export function removeStartPage(el: HTMLElement) {
    const startPage = el.querySelector('.player-start-page') as HTMLElement
    startPage?.parentElement?.removeChild(startPage)
}

export async function waitStart(el: HTMLElement): Promise<void> {
    const btn = showStartBtn(el)
    return new Promise(r => {
        btn.addEventListener('click', async () => {
            btn.classList.remove('show')
            await delay(500)
            r()
        })
    })
}

export function createIframeDOM(contentDocument: Document, snapshotData: SnapshotRecord['data']) {
    contentDocument.open()
    const doctype = snapshotData.doctype
    const doc = `<!DOCTYPE ${doctype.name} ${doctype.publicId ? 'PUBLIC ' + '"' + doctype.publicId + '"' : ''} ${
        doctype.systemId ? '"' + doctype.systemId + '"' : ''
    }><html><head></head><body></body></html>`
    contentDocument.write(doc)
    contentDocument.close()
}

export function injectIframeContent(contentDocument: Document, snapshotData: SnapshotRecord['data']) {
    const content = convertVNode(snapshotData.vNode)
    if (content) {
        const head = content.querySelector('head')
        if (head) {
            const style = parseHtmlStr(
                `<div>
                    <style>
                        ${FIXED_CSS}
                    </style>
                </div>`
            )[0].firstElementChild!
            head.appendChild(style)
        }
        const documentElement = contentDocument.documentElement
        content.scrollLeft = snapshotData.scrollLeft
        content.scrollTop = snapshotData.scrollTop
        contentDocument.replaceChild(content, documentElement)
    }
}
