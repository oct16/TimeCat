/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { nodeStore, debounce, createURL } from '@timecat/utils'
import HTML from '../ui.html'
import CSS from '../ui.scss'
import smoothScroll from 'smoothscroll-polyfill'
import { ReplayInternalOptions, VNode, InfoData } from '@timecat/share'
import { observer, Store, disableScrolling, parseHtmlStr, html, createIframeDOM, injectIframeContent } from '../utils'
import { PlayerEventTypes } from '../types'
import { PanelComponent } from './panel'
import { PageStartComponent } from './page-start'

export class ContainerComponent {
    panel: PanelComponent
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document
    resize: (options?: Partial<{ setWidth: number; setHeight: number; maxScale: number }>) => void
    options: ReplayInternalOptions
    target: Element | Window
    shadowHost: HTMLElement

    constructor(options: ReplayInternalOptions) {
        this.options = options
        this.init()
    }

    private init() {
        const target = this.options.target
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target
        this.target = targetElement as HTMLElement
        this.initTemplate()
        this.initSandbox()
        const { resize } = this.makeItResponsive()
        this.resize = resize
        this.initPanel()
    }

    private initPanel() {
        this.panel = new PanelComponent(this)
        new PageStartComponent()
    }

    private initSandbox() {
        this.sandBox = this.container.querySelector('.player-sandbox') as HTMLIFrameElement
        this.sandBoxDoc = this.sandBox.contentDocument!
        this.setSmoothScroll(this.sandBox.contentWindow!)
        createIframeDOM(this.sandBoxDoc, this.getSnapshotRecord())
        disableScrolling(this.sandBox.contentWindow!.document)
        this.setViewState()
    }

    private getSnapshotRecord() {
        return Store.getState().replayData.currentData.snapshot.data as {
            vNode: VNode
        } & InfoData
    }

    // use scroll polyfill if browser (e.g. ios safari) not support
    private setSmoothScroll(context: Window) {
        smoothScroll.polyfill()
        context.HTMLElement.prototype.scroll = window.scroll
        context.HTMLElement.prototype.scrollTo = window.scrollTo
    }

    public setViewState() {
        nodeStore.reset()
        const recordData = this.getSnapshotRecord()
        const { pathname, hash, href } = createURL(recordData.href) as URL
        const doc = this.sandBoxDoc
        const context = doc.defaultView as Window
        context.G_REPLAY_LOCATION = { ...(context.G_REPLAY_LOCATION || {}), ...{ path: pathname, hash, href } }
        injectIframeContent(this.sandBoxDoc, recordData)
    }

    private initTemplate() {
        const targetElement: HTMLElement =
            this.target instanceof Window ? (this.target as Window).document.body : (this.target as HTMLElement)

        const shadowHost = parseHtmlStr(html`<div class="player-shadowhost"></div>`)[0]
        targetElement.appendChild(shadowHost)

        const shadow = shadowHost.attachShadow({ mode: 'open' })
        shadow.appendChild(this.createStyle('player-css', CSS))
        shadow.appendChild(this.createContainer('player-main', HTML))
        this.shadowHost = shadowHost
    }

    private createContainer(className: string, html: string) {
        const parser = new DOMParser()
        const el = parser.parseFromString(html, 'text/html').body.firstChild as HTMLElement
        el.className = className
        el.style.width = this.getSnapshotRecord().width + 'px'
        el.style.height = this.getSnapshotRecord().height + 'px'
        el.style.display = 'none'
        return (this.container = el)
    }

    private makeItResponsive() {
        const self = this
        const debounceResizeFn = debounce(resizeHandle, 500)

        const callbackFn = () => debounceResizeFn({ target: self.target as EventTarget } as Event)
        window.addEventListener('resize', callbackFn, true)

        this.options.destroyStore.add(() => window.removeEventListener('resize', callbackFn, true))

        setTimeout(() => (this.container.style.opacity = '1'))
        this.container.style.display = 'block'

        let lockScale = 0

        triggerResize()

        function triggerResize(options?: Partial<{ setWidth: number; setHeight: number; maxScale: number }>) {
            const { setHeight, setWidth, maxScale } = options || {}
            resizeHandle(({ target: self.target } as unknown) as Event, setWidth, setHeight, maxScale)
        }

        async function resizeHandle(e?: Event, setWidth?: number, setHeight?: number, maxScale = 1) {
            if (!e) {
                return
            }
            const { width: targetWidth, height: targetHeight } = getPageSize(self.container)

            setWidth = setWidth || targetWidth
            setHeight = setHeight || targetHeight

            switch (maxScale) {
                case 0:
                    lockScale = 0
                    break
                case 100:
                    lockScale = 100
                    break
            }

            const setMaxScale = lockScale || maxScale

            if (e.target instanceof Window) {
                const { innerWidth: w, innerHeight: h } = e.target
                scalePages(self.container, w, h, setWidth, setHeight, setMaxScale)
            } else {
                const { offsetWidth: w, offsetHeight: h } = e.target as HTMLElement
                scalePages(self.container, w, h, setWidth, setHeight, setMaxScale)
            }
        }

        function scalePages(
            target: HTMLElement,
            maxWidth: number,
            maxHeight: number,
            setWidth: number,
            setHeight: number,
            setMaxScale: number
        ) {
            if (!self.options.disableScaling) {
                const { mode: replayMode } = Store.getState().player.options || {}

                const panelHeight = replayMode === 'live' ? 0 : 40 - 2 // subtract the gap

                const scaleX = maxWidth / setWidth
                const scaleY = maxHeight / (setHeight + panelHeight)

                // limit scale
                const scale = Math.min(scaleX > scaleY ? scaleY : scaleX, setMaxScale || 1)

                const left = (setWidth * scale - setWidth) / 2 + (maxWidth - setWidth * scale) / 2

                const top = (maxHeight - setHeight - panelHeight * scale) / 2

                target.style.transform = `scale(${scale})`
                target.style.left = left + 'px'
                target.style.top = top + 'px'
            }

            const currentWidth = parseInt(target.style.width)
            const currentHeight = parseInt(target.style.height)

            if (setWidth !== currentWidth || setHeight !== currentHeight) {
                target.style.width = setWidth + 'px'
                target.style.height = setHeight + 'px'
                observer.emit(PlayerEventTypes.RESIZE)
            }
        }

        function getPageSize(target: HTMLElement) {
            return {
                width: parseInt(target.style.width, 10),
                height: parseInt(target.style.height, 10)
            }
        }

        return {
            resize: triggerResize
        }
    }

    private createStyle(id: string, s: string) {
        const style = document.createElement('style')
        style.id = id
        style.innerHTML = s
        return style
    }
}
