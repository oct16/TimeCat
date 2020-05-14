import { VNode, convertVNode } from '@TimeCat/virtual-dom'
import { filteringTemplate, disableScrolling, nodeStore } from '@TimeCat/utils'
import HTML from './ui.html'
import CSS from './ui.css'
import FIXED from './fixed.css'
import { SnapshotData } from '@TimeCat/snapshot'

export class ContainerComponent {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document

    constructor() {
        this.init()
    }

    getSnapshot() {
        return window.__ReplayData__.snapshot
    }

    init() {
        this.initTemplate()
        this.initSandbox()
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#cat-sandbox') as HTMLIFrameElement
        this.sandBox.style.width = this.getSnapshot().width + 'px'
        this.sandBox.style.height = this.getSnapshot().height + 'px'
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
            documentElement.scrollLeft = this.getSnapshot().scrollLeft
            documentElement.scrollTop = this.getSnapshot().scrollTop
            this.sandBoxDoc.replaceChild(child, documentElement)
        }
    }

    initTemplate() {
        document.head.append(this.createStyle('cat-css', CSS))
        document.body.append(this.createContainer('cat-main', HTML))
    }

    createContainer(id: string, html: string) {
        const parser = new DOMParser()
        const element = parser.parseFromString(filteringTemplate(html), 'text/html').body.firstChild as HTMLElement
        element.id = id
        element.style.width = this.getSnapshot().width + 'px'
        element.style.height = this.getSnapshot().height + 'px'
        element.style.position = 'relative'
        element.style.margin = '0 auto'
        return (this.container = element)
    }

    createStyle(id: string, s: string) {
        const style = document.createElement('style')
        style.id = id
        style.innerHTML = s
        return style
    }
}
