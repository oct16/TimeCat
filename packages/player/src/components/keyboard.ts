import { ContainerComponent } from './container'
import { ConnectProps } from '../utils'
import { ReplayInternalOptions } from '@timecat/share'
import { Component, html } from '../utils/component'
import { Store } from '../utils/redux'
import { PlayerTypes } from '../utils/redux/reducers/player'

@Component(
    'player-keyboard',
    html`<div class="player-keyboard">
        <button class="play-or-pause" type="button" speed="1">▲</button>
    </div>`
)
export class KeyboardComponent {
    c: ContainerComponent
    options: ReplayInternalOptions
    controller: HTMLElement

    playOrPauseBtn: HTMLButtonElement

    constructor(options: ReplayInternalOptions, container: ContainerComponent) {
        this.options = options
        this.c = container
        this.init()
    }

    @ConnectProps(state => ({
        speed: state.player.speed
    }))
    watchPlayerSpeed(state?: { speed: number }) {
        if (state) {
            this.paly(state.speed)
            this.setSpeed(state.speed)
        }
    }

    init() {
        this.controller = this.c.container.querySelector('.player-keyboard') as HTMLElement
        this.playOrPauseBtn = this.c.container.querySelector('.play-or-pause') as HTMLButtonElement

        this.createFastForwardBtns(this.options.fastForward)
        this.controller.addEventListener('click', (e: MouseEvent & { target: HTMLElement & { type: string } }) => {
            if (e.target && e.target.type === 'button') {
                const speed = Number((e.target as HTMLElement).getAttribute('speed'))
                this.dispatchPlay(speed)
            }
        })

        this.watchPlayerSpeed()
        this.detectWindowIsActive()
    }

    createFastForwardBtns(speeds: number[]) {
        speeds = Array.from(new Set([1].concat(speeds)))
        if (speeds) {
            let html = ''
            speeds.forEach(speed => {
                html += `<button type="button" class="speed" speed="${speed}">${speed}x</button>`
            })
            const htmlTemp = document.createElement('div')
            htmlTemp.innerHTML = html
            this.controller.append(...htmlTemp.children)
        }
    }

    dispatchPlay(speed = 0) {
        Store.dispatch({
            type: PlayerTypes.SPEED,
            data: {
                speed
            }
        })
    }

    detectWindowIsActive() {
        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.visibilityState === 'hidden') {
                    this.dispatchPlay(0)
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
            return [...speedNodes].findIndex(node => node.getAttribute('speed') === speed.toString())
        }
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '')
        }
    }
}
