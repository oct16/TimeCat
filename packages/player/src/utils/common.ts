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
    ReplayInternalOptions
} from '@timecat/share'
import { decompressWithGzipByte } from 'brick.json/gzip/esm'
import { delay, idb } from '@timecat/utils'
import { Store } from './redux'
import mobile from 'is-mobile'
import { ContainerComponent } from '../components/container'
import DISABLE_POINTER_EVENTS_CSS from '../disable-pointer-events.scss'
import DISABLE_SCROLLBARS_CSS from '../disable-scrollbars.scss'
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
    function isAudioBufferStr(record: AudioRecord) {
        return record.data.type === 'base64'
    }

    const replayData: ReplayData = {
        head: {} as HeadRecord,
        snapshot: {} as SnapshotRecord,
        records: [],
        audio: {
            src: '',
            bufferStrList: [],
            subtitles: [],
            opts: {} as AudioOptionsData
        }
    }
    records.forEach((record, index) => {
        const next = records[index + 1]
        switch (record.type) {
            case RecordType.HEAD:
                if (next && !(next.data as SnapshotRecord['data']).frameId) {
                    replayData.head = record
                }
                break
            case RecordType.SNAPSHOT:
                if (!record.data.frameId) {
                    if (replayData) {
                        replayData.snapshot = record
                    }
                } else {
                    replayData.records.push(record)
                }
                break
            case RecordType.AUDIO:
                if (isAudioBufferStr(record as AudioRecord)) {
                    const audioData = record as AudioRecord
                    replayData.audio.bufferStrList.push(...(audioData.data as AudioStrList).data)
                } else {
                    replayData.audio.opts = (record as AudioRecord).data.data as AudioOptionsData
                }
                break

            default:
                if (replayData) {
                    replayData.records.push(record as RecordData)
                }
                break
        }
    })

    return replayData
}

export function getGZipData(): RecordData[] | null {
    const str = window.G_REPLAY_STR_RECORDS
    if (!str) {
        return null
    }

    const carry = 1 << 8
    const strArray = str.split('')
    const byteArray = new Uint8Array(strArray.length)
    for (let i = 0; i < strArray.length; i++) {
        const num = strArray[i].charCodeAt(0)
        byteArray[i] = num >= carry ? num - carry : num
    }

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
}

export function injectIframeContent(
    contentDocument: Document,
    snapshotData: SnapshotRecord['data'],
    cssOptions: ReplayInternalOptions['cssOptions']
) {
    const content = convertVNode(snapshotData.vNode)
    if (content) {
        const head = content.querySelector('head')
        if (head) {
            const style = parseHtmlStr(
                `<div>
                    <style>
                        ${cssOptions.disablePointerEvents ? DISABLE_POINTER_EVENTS_CSS : ''}
                        ${cssOptions.disableScrollbars ? DISABLE_SCROLLBARS_CSS : ''}
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
