import { PlayerTypes, reduxStore, exportReplay } from '@TimeCat/utils'
import { ContainerComponent } from './container'

export class KeyboardComponent {
    c: ContainerComponent
    controller: HTMLElement

    playOrPauseBtn: HTMLButtonElement
    exportBtn: HTMLElement

    constructor(container: ContainerComponent) {
        this.c = container
        this.init()
    }

    init() {
        this.controller = this.c.container.querySelector('.cat-keyboard') as HTMLElement
        this.playOrPauseBtn = this.c.container.querySelector('.play-or-pause') as HTMLButtonElement
        this.exportBtn = this.c.container.querySelector('.cat-export') as HTMLButtonElement
        this.exportBtn.addEventListener('click', this.export)
        this.controller.addEventListener('click', (e: MouseEvent & { target: HTMLElement & { type: string } }) => {
            if (e.target && e.target.type === 'button') {
                const speed = Number((e.target as HTMLElement).getAttribute('speed'))
                this.emitPlaySign(speed)
            }
        })

        reduxStore.subscribe('player', state => {
            this.paly(state.speed)
            this.setSpeed(state.speed)
        })

        this.listenDefocus()
    }

    emitPlaySign(speed: number) {
        reduxStore.dispatch({
            type: PlayerTypes.SPEED,
            data: {
                speed
            }
        })
    }

    listenDefocus() {
        let hidden: string = 'hidden'
        let state: string
        let visibilityChange: string
        if (typeof (document as any).webkitHidden !== undefined) {
            visibilityChange = 'webkitvisibilitychange'
            state = 'webkitVisibilityState'
        } else {
            visibilityChange = 'visibilitychange'
            state = 'visibilityState'
        }

        document.addEventListener(
            visibilityChange,
            () => {
                if (document.visibilityState === hidden) {
                    this.emitPlaySign(0)
                }
            },
            false
        )
    }

    paly(speed: number) {
        if (speed !== 0) {
            this.playOrPauseBtn.innerText = '〓'
            this.playOrPauseBtn.setAttribute('style', 'letter-spacing: 1px;font-weight: bold;')
            this.playOrPauseBtn.removeAttribute('speed')
        } else {
            this.playOrPauseBtn.innerText = '▲'
            this.playOrPauseBtn.removeAttribute('style')
            this.playOrPauseBtn.setAttribute('speed', '1')
        }
    }

    setSpeed(speed: number) {
        const speedNodes = this.c.container.querySelectorAll('.speed') as NodeListOf<HTMLButtonElement>
        ;[...speedNodes].forEach(node => {
            node.removeAttribute('disabled')
        })

        const index = getBtnIndex(speed)

        function getBtnIndex(speed: number) {
            switch (speed) {
                case 16:
                    return 2
                case 4:
                    return 1
                case 1:
                    return 0
                default:
                    return 0
            }
        }
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '')
        }
    }

    export() {
        const mainScript = document.getElementById('time-cat') as HTMLScriptElement
        const initScript = document.getElementById('time-cat-init') as HTMLScriptElement
        const scriptList = []

        if (mainScript) {
            const source = (mainScript.src || mainScript.textContent)!
            scriptList.push({
                name: 'time-cat',
                src: source
            })
        }

        if (initScript) {
            const source = (initScript.src || initScript.textContent)!
            scriptList.push({
                name: 'time-cat-init',
                src: source
            })
        }

        const replayOptions = window.__ReplayOptions__
        exportReplay({
            ...replayOptions,
            scripts: scriptList
        })
    }
}
