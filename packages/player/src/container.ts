import { VNode, diffNode } from '@WebReplay/virtual-dom'
import HTML from './ui.html'
import STYLE from './ui.css'
import { Pointer } from './pointer'

export class Container {
    container: HTMLElement
    snapshotHTML: string
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
        this.renderHTML()
        this.initTemplate()
        this.initSandbox()
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#wr-sandbox') as HTMLIFrameElement
        this.sandBox.style.width = this.width - 20 + 'px'
        this.sandBox.style.height = this.height - 44 + 'px'
        ;(this.sandBox.contentWindow as Window).document.documentElement.innerHTML = this.snapshotHTML
        const sandboxBody = (this.sandBox.contentWindow as Window).document.documentElement.getElementsByTagName(
            'body'
        )[0]
        sandboxBody.style.margin = '10px'
    }

    convertBack() {
        return diffNode(this.vNode, null)
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
        return (this.container = element)
    }

    createStyle() {
        const parser = new DOMParser()
        const style = parser.parseFromString(`<style>${STYLE}</style>`, 'text/html').head.firstChild as HTMLElement
        return style
    }

    renderHTML() {
        const html = this.convertBack()
        if (html) {
            this.snapshotHTML = html.innerHTML
        }
    }
}
