import { convertVNode } from '@TimeCat/virtual-dom'
import { filteringTemplate, disableScrolling, nodeStore, debounce } from '@TimeCat/utils'
import HTML from './ui.html'
import CSS from './ui.css'
import FIXED from './fixed.css'

export class ContainerComponent {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document
    resize: (w?: number, h?: number) => void

    constructor() {
        this.init()
    }

    getSnapshot() {
        return window.__ReplayData__.snapshot
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
        this.sandBoxDoc.open()

        const doctype = this.getSnapshot().doctype
        const doc = `<!DOCTYPE ${doctype.name} ${doctype.publicId ? 'PUBLIC ' + '"' + doctype.publicId + '"' : ''} ${
            doctype.systemId ? '"' + doctype.systemId + '"' : ''
        }><html><head></head><body></body></html>`
        this.sandBoxDoc.write(doc)
        this.sandBoxDoc.close()
        disableScrolling(this.sandBox.contentWindow!)
        this.setViewState()
    }

    setViewState() {
        nodeStore.reset()
        const child = convertVNode(this.getSnapshot().vNode)

        if (child) {
            const [head] = child.getElementsByTagName('head')
            if (head) {
                head.insertBefore(this.createStyle('cat-css-fix', FIXED), head.firstChild)
            }
            const documentElement = this.sandBoxDoc.documentElement
            child.scrollLeft = this.getSnapshot().scrollLeft
            child.scrollTop = this.getSnapshot().scrollTop
            this.sandBoxDoc.replaceChild(child, documentElement)
        }
    }

    initTemplate() {
        document.head.append(this.createStyle('cat-css', CSS))
        document.body.append(this.createContainer('cat-main', HTML))
    }

    createContainer(id: string, html: string) {
        const parser = new DOMParser()
        const el = parser.parseFromString(filteringTemplate(html), 'text/html').body.firstChild as HTMLElement
        el.id = id
        el.style.width = this.getSnapshot().width + 'px'
        el.style.height = this.getSnapshot().height + 'px'
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
            const { width: targetWidth, height: targetHeight } = getPageSize(target)

            const scaleX = maxWidth / (setWidth || targetWidth)
            const scaleY = maxHeight / (setHeight || targetHeight)
            const scale = scaleX > scaleY ? scaleY : scaleX
            const maxScale = scale > 1 ? 1 : scale

            const left = Math.abs(Math.floor(((setWidth || targetWidth) * maxScale - maxWidth) / 2))
            const top = Math.abs(Math.floor(((setHeight || targetHeight) * maxScale - maxHeight) / 2))
            target.style.transform = 'scale(' + maxScale + ')'
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
