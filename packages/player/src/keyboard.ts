import { exportReplay, getRawScriptContent } from '@timecat/utils'
import { ContainerComponent } from './container'
import { PlayerTypes, reduxStore } from './utils'
import { ReplayInternalOptions } from '@timecat/share'

export class KeyboardComponent {
    c: ContainerComponent
    options: ReplayInternalOptions
    controller: HTMLElement

    playOrPauseBtn: HTMLButtonElement
    exportBtn: HTMLElement
    fullscreenBtn: HTMLElement

    constructor(options: ReplayInternalOptions, container: ContainerComponent) {
        this.options = options
        this.c = container
        this.init()
    }

    init() {
        this.controller = this.c.container.querySelector('.cat-keyboard') as HTMLElement
        this.playOrPauseBtn = this.c.container.querySelector('.play-or-pause') as HTMLButtonElement
        this.exportBtn = this.c.container.querySelector('.cat-export') as HTMLButtonElement
        this.fullscreenBtn = this.c.container.querySelector('.cat-fullscreen') as HTMLButtonElement
        this.exportBtn.addEventListener('click', this.export)
        this.fullscreenBtn.addEventListener('click', this.setFullScreen)
        this.createFastForwardBtns(this.options.fastForward)
        this.controller.addEventListener('click', (e: MouseEvent & { target: HTMLElement & { type: string } }) => {
            if (e.target && e.target.type === 'button') {
                const speed = Number((e.target as HTMLElement).getAttribute('speed'))
                this.dispatchPlay(speed)
            }
        })

        reduxStore.subscribe('player', state => {
            if (state) {
                this.paly(state.speed)
                this.setSpeed(state.speed)
            }
        })

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
        reduxStore.dispatch({
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
                    this.dispatchPlay()
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

    async export() {
        const SDKScript = document.getElementById('timecat') as HTMLScriptElement
        const initScript = document.getElementById('timecat-init') as HTMLScriptElement
        const scriptList = []
        const scripts = document.querySelectorAll('script')

        function detectSDKSrc() {
            // TODO Support ESM module
            return Array.from(scripts)
                .map(script => script.src)
                .find(src => /(timecat)(\.prod)?\.global\.js/.test(src))
        }

        function detectSDKContent() {
            return Array.from(scripts)
                .map(script => script.textContent)
                .find(content => content?.trim().startsWith('var TimeCat'))
        }

        function detectInitScriptContent() {
            return Array.from(scripts)
                .map(script => script.textContent)
                .find(content => {
                    if (content) {
                        return /new\s(TimeCat\.)?Player/.test(content)
                    }
                })
        }

        async function getScriptSource(scriptElement: HTMLScriptElement) {
            if (!scriptElement) {
                return
            }
            return (
                scriptElement.textContent || (await getRawScriptContent(scriptElement.src.trim())) || scriptElement.src
            )
        }

        const defaultSDK = `//cdn.jsdelivr.net/npm/timecatjs/dist/timecat.global.prod.js`
        const SDKSource = (await getScriptSource(SDKScript)) || detectSDKSrc() || detectSDKContent() || defaultSDK

        scriptList.push({
            name: 'timecat',
            src: SDKSource
        })

        const defaultInitScript = `new window.TimeCat.Player({autoplay: true})`
        const source = (await getScriptSource(initScript)) || detectInitScriptContent() || defaultInitScript
        scriptList.push({
            name: 'timecat-init',
            src: source
        })

        const replayOptions = window.G_REPLAY_OPTIONS
        exportReplay({
            ...replayOptions,
            scripts: scriptList
        })
    }

    setFullScreen(this: HTMLButtonElement) {
        this.ownerDocument.body.requestFullscreen()
    }
}
