import { PlayerTypes, reduxStore, exportReplay, getRawScriptContent } from '@timecat/utils'
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
            switch (speed) {
                case 100:
                    return 2
                case 10:
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

        const SDKSource = (await getScriptSource(SDKScript)) || detectSDKSrc() || detectSDKContent()
        scriptList.push({
            name: 'timecat',
            src: SDKSource
        })

        const source = (await getScriptSource(initScript)) || detectInitScriptContent()
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
}
