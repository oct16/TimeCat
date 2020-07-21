import { filteringTemplate, disableScrolling, nodeStore, debounce } from '@timecat/utils'
import HTML from './ui.html'
import CSS from './ui.scss'
import { createIframeDOM, injectIframeContent } from './dom'

export class ContainerComponent {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document
    resize: (w?: number, h?: number) => void

    constructor() {
        this.init()
    }

    getSnapshotData() {
        return window.__ReplayData__.snapshot.data
    }

    init() {
        this.initTemplate()
        this.initSandbox()
        const { resize } = this.makeItResponsive(this.container)
        this.resize = resize
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#cat-sandbox') as HTMLIFrameElement
        this.sandBoxDoc = this.sandBox.contentDocument!
        createIframeDOM(this.sandBoxDoc, this.getSnapshotData())
        disableScrolling(this.sandBox.contentWindow!.document)
        this.setViewState()
    }

    setViewState() {
        nodeStore.reset()
        injectIframeContent(this.sandBoxDoc, this.getSnapshotData())
    }

    initTemplate() {
        document.head.append(this.createStyle('cat-css', CSS))
        document.body.append(this.createContainer('cat-main', HTML))
    }

    createContainer(id: string, html: string) {
        const parser = new DOMParser()
        const el = parser.parseFromString(filteringTemplate(html), 'text/html').body.firstChild as HTMLElement
        el.id = id
        el.style.width = this.getSnapshotData().width + 'px'
        el.style.height = this.getSnapshotData().height + 'px'
        el.style.display = 'none'
        return (this.container = el)
    }

    makeItResponsive(target: HTMLElement) {
        const debounceResizeFn = debounce(resizeHandle, 500)
        window.addEventListener('resize', debounceResizeFn.bind(this))

        triggerResize()

        setTimeout(() => (this.container.style.opacity = '1'))
        this.container.style.display = 'block'

        function triggerResize(w?: number, h?: number) {
            resizeHandle(({ target: window } as unknown) as Event, w, h)
        }

        function resizeHandle(e?: Event, setWidth?: number, setHeight?: number) {
            if (e && e.target instanceof Window) {
                const { innerWidth: w, innerHeight: h } = e.target
                scalePages(target, w, h, setWidth, setHeight)
            }
        }

        function scalePages(
            target: HTMLElement,
            maxWidth: number,
            maxHeight: number,
            setWidth?: number,
            setHeight?: number
        ) {
            const panelHeight = 40 - 2 // subtract the gap

            const { width: targetWidth, height: targetHeight } = getPageSize(target)

            const scaleX = maxWidth / (setWidth || targetWidth)
            const scaleY = maxHeight / ((setHeight || targetHeight) + panelHeight)

            // max zoom 1
            const scale = Math.min(scaleX > scaleY ? scaleY : scaleX, 1)

            const left =
                ((setWidth || targetWidth) * scale - targetWidth) / 2 +
                (maxWidth - (setWidth || targetWidth) * scale) / 2

            const top = (maxHeight - targetHeight - panelHeight * scale) / 2

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
                width: parseInt(target.style.width),
                height: parseInt(target.style.height)
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
