import { VNode, convertVNode } from '@WebReplay/virtual-dom'
import HTML from './ui.html'
import STYLE from './ui.css'
import { Pointer } from './pointer'

export class Container {
    container: HTMLElement
    sandBox: HTMLIFrameElement
    pointer: Pointer

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
        const sandBoxDoc = (this.sandBox.contentWindow as Window).document
        sandBoxDoc.replaceChild(convertVNode(this.vNode, null)!, sandBoxDoc.documentElement)
    }

    initTemplate() {
        document.head.appendChild(this.createStyle())
        document.body.appendChild(this.createContainer())
    }

    createContainer() {
        const parser = new DOMParser()
        const element = parser.parseFromString(HTML, 'text/html').body.firstChild as HTMLElement
        element.style.width = this.width + 'px'
        element.style.height = this.height + 'px'
        element.style.margin = '0 auto'
        return (this.container = element)
    }

    createStyle() {
        const parser = new DOMParser()
        const style = parser.parseFromString(`<style>${STYLE}</style>`, 'text/html').head.firstChild as HTMLElement
        return style
    }
}
