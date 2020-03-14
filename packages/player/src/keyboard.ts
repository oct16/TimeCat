// import { Redux } from '@WebReplay/utils'

import { reduxStore } from '@WebReplay/utils'
import { PlayerTypes } from '@WebReplay/utils'

export class KeyboardComponent {
    container: HTMLElement
    controller: HTMLElement

    pauseBtn: HTMLElement
    playBtn: HTMLElement

    speed: number

    constructor(container: HTMLElement) {
        this.container = container
        this.init()
    }

    init() {
        this.controller = this.container.querySelector('.wr-keyboard') as HTMLElement
        this.pauseBtn = this.controller.querySelector('.pause') as HTMLButtonElement
        this.playBtn = this.controller.querySelector('.play') as HTMLButtonElement
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
        const speedNodes = this.container.querySelectorAll('.speed') as NodeListOf<HTMLButtonElement>
        ;[...speedNodes].forEach(node => {
            node.removeAttribute('disabled')
        })
        const index = speed === 1 ? 0 : speed === 2 ? 1 : speed === 4 ? 2 : -1
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '')
        }
    }
}
