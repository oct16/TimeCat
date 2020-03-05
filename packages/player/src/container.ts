import { VNode, diffNode } from '@WebReplay/virtual-dom'
import UI from './ui.html'
import STYLE from './ui.css'
import { Pointer } from './pointer'
import { Player } from './player'
import { SnapshotData } from '@WebReplay/snapshot'

export class Container {
    data: SnapshotData[]
    player: Player
    container: HTMLElement
    controller: HTMLElement
    snapshotHTML: string
    sandBox: HTMLIFrameElement
    pointer: Pointer

    vNode: VNode
    width: number
    height: number

    constructor(params: { vNode: VNode; width: number; height: number; data: SnapshotData[] }) {
        this.vNode = params.vNode
        this.width = params.width
        this.height = params.height
        this.data = params.data
        this.init()
    }

    init() {
        this.renderHTML()
        this.initCtrlPanel()
        this.initSandbox()
        this.initPlayer()
    }

    initPlayer() {
        const player = new Player(this.data)
        this.player = player
        player.play()
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

    initCtrlPanel() {
        document.head.appendChild(this.createStyle())
        document.body.appendChild(this.createContainer())

        this.controller = this.container.querySelector('.controller') as HTMLElement
        this.container.addEventListener('click', (e: MouseEvent) => {
            const target = e.target
            if (target) {
                const command = (target as HTMLElement).getAttribute('command')
                this.command(command as any)
            }
        })
    }

    command(c: 'play' | 'pause' | 'x1' | 'x4' | 'x8') {
        const pauseBtn = this.container.querySelector('.pause') as HTMLButtonElement
        const playBtn = this.container.querySelector('.play') as HTMLButtonElement
        const [x1, x4, x8] = this.container.querySelectorAll('.speed') as NodeListOf<HTMLButtonElement>
        switch (c) {
            case 'play':
                pauseBtn.removeAttribute('disabled')
                playBtn.setAttribute('disabled', '')
                this.player.play()
                break
            case 'pause':
                playBtn.removeAttribute('disabled')
                pauseBtn.setAttribute('disabled', '')
                this.player.pause()
                break
            case 'x1':
                x8.removeAttribute('disabled')
                x4.removeAttribute('disabled')
                x1.setAttribute('disabled', '')
                this.player.setSpeed(1)
                break
            case 'x4':
                x8.removeAttribute('disabled')
                x1.removeAttribute('disabled')
                x4.setAttribute('disabled', '')
                this.player.setSpeed(4)
                break
            case 'x8':
                x1.removeAttribute('disabled')
                x4.removeAttribute('disabled')
                x8.setAttribute('disabled', '')
                this.player.setSpeed(8)
                break
            default:
                break
        }
    }

    createContainer() {
        const parser = new DOMParser()
        const element = parser.parseFromString(UI, 'text/html').body.firstChild as HTMLElement
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
