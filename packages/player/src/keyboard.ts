import { Redux } from '@WebReplay/utils'

export class Keyboard {
    container: HTMLElement
    controller: HTMLElement

    pauseBtn: HTMLElement
    playBtn: HTMLElement

    constructor(container: HTMLElement) {
        this.container = container
        this.initCtrlKeyboard()
    }

    initCtrlKeyboard() {
        this.controller = this.container.querySelector('.wr-keyboard') as HTMLElement
        this.pauseBtn = this.controller.querySelector('.pause') as HTMLButtonElement
        this.playBtn = this.controller.querySelector('.play') as HTMLButtonElement
        this.controller.addEventListener('click', (e: MouseEvent) => {
            if (e.target) {
                const speed = (e.target as HTMLElement).getAttribute('speed')
                Redux.dispatch({
                    type: 'PLAY',
                    data: {
                        speed
                    }
                })
            }
        })

        Redux.subscribe(state => {
            if (!isNaN(state.speed)) {
                this.paly(state.speed)
                this.setSpeed(state.speed)
            }
        })
    }

    paly(speed: number) {
        if (speed != 0) {
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
        const index = speed == 1 ? 0 : speed == 4 ? 1 : speed == 8 ? 2 : -1
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '')
        }
    }
}
