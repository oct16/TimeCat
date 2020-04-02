import { VNode, convertVNode } from '@WebReplay/virtual-dom'
import HTML from './ui.html'
import STYLE from './ui.css'
import FIXED from './fixed.css'
import { filteringTemplate, disableScrolling } from '@WebReplay/utils'

export class ContainerComponent {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    sandBoxDoc: Document

    vNode: VNode
    width: number
    height: number

    constructor(params: { vNode: VNode; width: number; height: number }) {
        this.vNode = params.vNode
        this.width = params.width
        this.height = params.height
        this.init()
    }

    init() {
        this.initTemplate()
        this.initSandbox()
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#wr-sandbox') as HTMLIFrameElement
        this.sandBox.style.width = this.width + 'px'
        this.sandBox.style.height = this.height + 'px'
        this.sandBoxDoc = this.sandBox.contentDocument!
        this.sandBoxDoc.open()
        this.sandBoxDoc.write('<!DOCTYPE html><html><head></head><body></body></html>')
        this.sandBoxDoc.close()
        disableScrolling(this.sandBox.contentWindow!)
        this.setViewState()
    }

    setViewState() {
        const child = convertVNode(this.vNode, null)
        if (child) {
            const head = child.firstChild
            if (head) {
                head.insertBefore(this.createStyle(FIXED), head.firstChild)
            }
            const documentElement = this.sandBoxDoc.documentElement
            documentElement.replaceChild(child.firstChild!, documentElement.firstChild!)
            documentElement.replaceChild(child.lastChild!, documentElement.lastChild!)
            documentElement.scrollLeft = window.__ReplayData__.scrollLeft
            documentElement.scrollTop = window.__ReplayData__.scrollTop
        }
    }

    initTemplate() {
        document.head.appendChild(this.createStyle(STYLE))
        document.body.appendChild(this.createContainer())
    }

    createContainer() {
        const parser = new DOMParser()
        const element = parser.parseFromString(filteringTemplate(HTML), 'text/html').body.firstChild as HTMLElement
        element.style.width = this.width + 'px'
        element.style.height = this.height + 'px'
        element.style.position = 'relative'
        element.style.margin = '0 auto'
        return (this.container = element)
    }

    createStyle(s: string) {
        const style = document.createElement('style')
        style.innerHTML = s
        return style
    }
}
