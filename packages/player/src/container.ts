import { disableScrolling, nodeStore, debounce } from '@timecat/utils'
import HTML from './ui.html'
import CSS from './ui.scss'
import { createIframeDOM, injectIframeContent } from './dom'
import smoothScroll from 'smoothscroll-polyfill'
import { ReplayInternalOptions } from '@timecat/share'

export class ContainerComponent {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document
    resize: (w?: number, h?: number) => void
    options: ReplayInternalOptions
    target: Element | Window

    constructor(options: ReplayInternalOptions) {
        this.options = options
        this.init()
    }

    init() {
        const target = this.options.target
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target
        this.target = targetElement as HTMLElement
        this.initTemplate()
        this.initSandbox()
        const { resize } = this.makeItResponsive()
        this.resize = resize
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#cat-sandbox') as HTMLIFrameElement
        this.sandBoxDoc = this.sandBox.contentDocument!
        this.setSmoothScroll(this.sandBox.contentWindow!)
        createIframeDOM(this.sandBoxDoc, this.getSnapshotRecord())
        disableScrolling(this.sandBox.contentWindow!.document)
        this.setViewState()
    }

    getSnapshotRecord() {
        return window.G_REPLAY_DATA.snapshot.data
    }

    // use scroll polyfill if browser (e.g. ios safari) not support
    setSmoothScroll(context: Window) {
        smoothScroll.polyfill()
        context.HTMLElement.prototype.scroll = window.scroll
        context.HTMLElement.prototype.scrollTo = window.scrollTo
    }

    setViewState() {
        nodeStore.reset()
        injectIframeContent(this.sandBoxDoc, this.getSnapshotRecord())
    }

    initTemplate() {
        const targetElement: HTMLElement =
            this.target instanceof Window ? (this.target as Window).document.body : (this.target as HTMLElement)
        targetElement.append(this.createStyle('cat-css', CSS))
        targetElement.append(this.createContainer('cat-main', HTML))
    }

    createContainer(id: string, html: string) {
        const parser = new DOMParser()
        const el = parser.parseFromString(html, 'text/html').body.firstChild as HTMLElement
        el.id = id
        el.style.width = this.getSnapshotRecord().width + 'px'
        el.style.height = this.getSnapshotRecord().height + 'px'
        el.style.display = 'none'
        return (this.container = el)
    }

    makeItResponsive() {
        const self = this
        const debounceResizeFn = debounce(resizeHandle, 500)

        const callbackFn = () => debounceResizeFn({ target: self.target as EventTarget } as Event)
        window.addEventListener('resize', callbackFn, true)

        this.options.destroyStore.add(() => window.removeEventListener('resize', callbackFn, true))

        triggerResize()

        setTimeout(() => (this.container.style.opacity = '1'))
        this.container.style.display = 'block'

        function triggerResize(setWidth?: number, setHeight?: number) {
            resizeHandle(({ target: self.target } as unknown) as Event, setWidth, setHeight)
        }

        function resizeHandle(e?: Event, setWidth?: number, setHeight?: number) {
            if (!e) {
                return
            }

            if (e.target instanceof Window) {
                const { innerWidth: w, innerHeight: h } = e.target
                scalePages(self.container, w, h, setWidth, setHeight)
            } else {
                const { offsetWidth: w, offsetHeight: h } = e.target as HTMLElement
                scalePages(self.container, w, h, setWidth, setHeight)
            }
        }

        function scalePages(
            target: HTMLElement,
            maxWidth: number,
            maxHeight: number,
            setWidth?: number,
            setHeight?: number
        ) {
            const { mode: replayMode } = window.G_REPLAY_OPTIONS || {}

            const panelHeight = replayMode === 'live' ? 0 : 40 - 2 // subtract the gap

            const { width: targetWidth, height: targetHeight } = getPageSize(target)

            const scaleX = maxWidth / (setWidth || targetWidth)
            const scaleY = maxHeight / ((setHeight || targetHeight) + panelHeight)

            // max zoom 1
            const scale = Math.min(scaleX > scaleY ? scaleY : scaleX, 1)

            const left =
                ((setWidth || targetWidth) * scale - (setWidth || targetWidth)) / 2 +
                (maxWidth - (setWidth || targetWidth) * scale) / 2

            const top = (maxHeight - (setHeight || targetHeight) - panelHeight * scale) / 2

            target.style.transform = `scale(${scale})`
            target.style.left = left + 'px'
            target.style.top = top + 'px'

            if (setWidth) {
                target.style.width = setWidth + 'px'
            }
            if (setHeight) {
                target.style.height = setHeight + 'px'
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

    createStyle(id: string, s: string) {
        const style = document.createElement('style')
        style.id = id
        style.innerHTML = s
        return style
    }
}
