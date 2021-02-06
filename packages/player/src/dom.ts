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
    FormElementRecordData,
    RecordType,
    DOMRecordData,
    LocationRecordData,
    CanvasRecordData,
    SnapshotRecord,
    PreFetchRecordData
} from '@timecat/share'
import FIXED_CSS from './fixed.scss'
import { PlayerComponent } from './components/player'
import { delay } from '@timecat/utils'
import { convertVNode } from '@timecat/virtual-dom'
import { ContainerComponent } from './components/container'
import { html, parseHtmlStr } from './utils'
import { renderCanvas } from './renders/canvas'
import { renderFont } from './renders/font'
import { renderPatch } from './renders/patch'
import { renderLocation } from './renders/location'
import { renderSnapshot } from './renders/snapshot'
import { renderScroll } from './renders/scroll'
import { renderWindow } from './renders/window'
import { renderMouse } from './renders/mouse'
import { renderFormEl } from './renders/form-el'
import { renderDom } from './renders/dom'

export async function updateDom(
    this: PlayerComponent,
    record: RecordData,
    opts?: { speed: number; isJumping: boolean }
) {
    const { isJumping, speed } = opts || {}
    const delayTime = isJumping ? 0 : 200
    const { type, data } = record

    // waiting for mouse or scroll transform animation finish
    const actionDelay = () => (delayTime ? delay(delayTime) : Promise.resolve())

    switch (type) {
        case RecordType.SNAPSHOT: {
            renderSnapshot(data as SnapshotRecord['data'])
            break
        }

        case RecordType.SCROLL: {
            renderScroll.call(this, data)
            break
        }
        case RecordType.WINDOW: {
            renderWindow.call(this, data)
            break
        }
        case RecordType.MOUSE: {
            renderMouse.call(this, data)
            break
        }
        case RecordType.DOM: {
            if (!isJumping && speed === 1) {
                await actionDelay()
            }
            renderDom(data as DOMRecordData)
            break
        }
        case RecordType.FORM_EL: {
            if (!isJumping && speed === 1) {
                await actionDelay()
            }
            renderFormEl(data as FormElementRecordData, { isJumping })
            break
        }
        case RecordType.LOCATION: {
            renderLocation(data as LocationRecordData)
            break
        }
        case RecordType.CANVAS: {
            if (!isJumping && speed === 1) {
                await actionDelay()
            }
            renderCanvas(data as CanvasRecordData)
            break
        }
        case RecordType.FONT: {
            renderFont.call(this, data as CanvasRecordData)
            break
        }
        case RecordType.PATCH: {
            renderPatch(data as PreFetchRecordData)
            break
        }
        default: {
            break
        }
    }
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

export function injectIframeContent(contentDocument: Document, snapshotData: SnapshotRecord['data']) {
    const content = convertVNode(snapshotData.vNode)
    if (content) {
        const head = content.querySelector('head')
        if (head) {
            const style = parseHtmlStr(
                html`<div>
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
