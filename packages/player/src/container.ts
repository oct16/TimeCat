import { VNode, diffNode } from '@WebReplay/virtual-dom'
import UI from './ui.html'

export class Container {
    container: HTMLElement
    snapshotHTML: string
    sandBox: HTMLIFrameElement

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
        this.createCtrlPanel()
        this.initSandbox()
    }

    initSandbox() {
        this.sandBox = this.container.querySelector('#wr-sandbox') as HTMLIFrameElement
        this.sandBox.style.width = this.width + 'px'
        this.sandBox.style.height = this.height + 'px'
        ;(this.sandBox.contentWindow as Window).document.documentElement.innerHTML = this.snapshotHTML
    }

    convertBack() {
        return diffNode(this.vNode, null)
    }

    createCtrlPanel() {
        this.container = this.createContainer()
        document.body.appendChild(this.container as Element)
    }

    createContainer() {
        const container = document.createElement('div')
        container.innerHTML = UI
        const child = container.firstChild as HTMLElement
        child.style.width = this.width + 'px'
        child.style.height = this.height + 'px'
        return child
    }

    renderHTML() {
        const html = this.convertBack()
        if (html) {
            this.snapshotHTML = html.innerHTML
        }
    }
}
