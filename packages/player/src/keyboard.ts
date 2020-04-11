// import { Redux } from '@WebReplay/utils'

import { PlayerTypes, reduxStore, exportReplay } from '@WebReplay/utils'
import { ContainerComponent } from './container'

export class KeyboardComponent {
    c: ContainerComponent
    controller: HTMLElement

    pauseBtn: HTMLElement
    playBtn: HTMLElement
    exportBtn: HTMLElement

    speed: number

    constructor(container: ContainerComponent) {
        this.c = container
        this.init()
    }

    init() {
        this.controller = this.c.container.querySelector('.wr-keyboard') as HTMLElement
        this.pauseBtn = this.controller.querySelector('.pause') as HTMLButtonElement
        this.exportBtn = this.c.container.querySelector('.wr-export') as HTMLButtonElement
        this.playBtn = this.controller.querySelector('.play') as HTMLButtonElement
        this.exportBtn.addEventListener('click', this.export)
        this.controller.addEventListener('click', (e: MouseEvent & { target: HTMLElement & { type: string } }) => {
            if (e.target && e.target.type === 'button') {
                const speed = Number((e.target as HTMLElement).getAttribute('speed'))
                this.speed = speed
                reduxStore.dispatch({
                    type: PlayerTypes.SPEED,
                    data: {
                        speed
                    }
                })
            }
        })

        reduxStore.subscribe('player', state => {
            this.paly(state.speed)
            this.setSpeed(state.speed)
        })
    }

    paly(speed: number) {
        if (speed !== 0) {
            this.pauseBtn.removeAttribute('disabled')
            this.playBtn.setAttribute('disabled', '')
        } else {
            this.playBtn.removeAttribute('disabled')
            this.pauseBtn.setAttribute('disabled', '')
        }
    }

    setSpeed(speed: number) {
        const speedNodes = this.c.container.querySelectorAll('.speed') as NodeListOf<HTMLButtonElement>
        ;[...speedNodes].forEach(node => {
            node.removeAttribute('disabled')
        })

        const index = speed === 1 ? 0 : speed === 4 ? 1 : speed === 8 ? 2 : -1
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '')
        }
    }

    export() {
        const mainScript = document.getElementById('web-replay') as HTMLScriptElement
        const initScript = document.getElementById('web-replay-init') as HTMLScriptElement
        const scriptList = []

        if (mainScript) {
            const source = (mainScript.src || mainScript.textContent)!
            scriptList.push({
                name: 'web-replay',
                src: source
            })
        }

        if (initScript) {
            const source = (initScript.src || initScript.textContent)!
            scriptList.push({
                name: 'web-replay-init',
                src: source
            })
        }

        exportReplay({
            scripts: scriptList
        })
    }
}
