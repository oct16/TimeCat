import { Component, html } from '../utils/component'
import { ContainerComponent } from './container'
import { exportReplay, getRawScriptContent } from '@timecat/utils'

@Component(
    'player-toolbox',
    html`<div class="player-toolbox">
        <div class="player-export">
            <button type="button">
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    width="16px"
                    height="16px"
                    viewBox="0 0 511.994 511.994"
                    style="enable-background:new 0 0 511.994 511.994;"
                    xml:space="preserve"
                >
                    <path
                        style="fill:#fff;"
                        d="M403.079,310.458c-3.627-7.232-11.008-11.797-19.093-11.797h-64v-85.333c0-11.776-9.536-21.333-21.333-21.333H213.32
            c-11.776,0-21.333,9.557-21.333,21.333v85.333h-64c-8.064,0-15.445,4.565-19.072,11.797c-3.605,7.232-2.837,15.872,2.027,22.336
            l128,170.667c4.011,5.376,10.347,8.533,17.045,8.533c6.72,0,13.056-3.157,17.067-8.533l128-170.667
            C405.917,326.33,406.685,317.69,403.079,310.458z"
                    />
                    <path
                        style="fill:#fff;"
                        d="M298.663,128.001H213.33c-11.797,0-21.333,9.536-21.333,21.333c0,11.797,9.536,21.333,21.333,21.333h85.333
                        c11.797,0,21.333-9.536,21.333-21.333C319.996,137.537,310.46,128.001,298.663,128.001z"
                    />
                    <path
                        style="fill:#fff;"
                        d="M298.663,64.001H213.33c-11.797,0-21.333,9.536-21.333,21.333s9.536,21.333,21.333,21.333h85.333
                        c11.797,0,21.333-9.536,21.333-21.333S310.46,64.001,298.663,64.001z"
                    />
                </svg>
            </button>
        </div>
        <div class="player-fullscreen">
            <svg
                version="1.1"
                id="Capa_1"
                width="16px"
                height="16px"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 469.333 469.333"
                style="enable-background:new 0 0 469.333 469.333;"
                xml:space="preserve"
            >
                <path
                    style="fill:#fff;"
                    d="M160,0H10.667C4.771,0,0,4.771,0,10.667V160c0,5.896,4.771,10.667,10.667,10.667H32c5.896,0,10.667-4.771,10.667-10.667
                V42.667H160c5.896,0,10.667-4.771,10.667-10.667V10.667C170.667,4.771,165.896,0,160,0z"
                />
                <path
                    style="fill:#fff;"
                    d="M458.667,0H309.333c-5.896,0-10.667,4.771-10.667,10.667V32c0,5.896,4.771,10.667,10.667,10.667h117.333V160
                c0,5.896,4.771,10.667,10.667,10.667h21.333c5.896,0,10.667-4.771,10.667-10.667V10.667C469.333,4.771,464.563,0,458.667,0z"
                />
                <path
                    style="fill:#fff;"
                    d="M458.667,298.667h-21.333c-5.896,0-10.667,4.771-10.667,10.667v117.333H309.333c-5.896,0-10.667,4.771-10.667,10.667
                v21.333c0,5.896,4.771,10.667,10.667,10.667h149.333c5.896,0,10.667-4.771,10.667-10.667V309.333
                C469.333,303.437,464.563,298.667,458.667,298.667z"
                />
                <path
                    style="fill:#fff;"
                    d="M160,426.667H42.667V309.333c0-5.896-4.771-10.667-10.667-10.667H10.667C4.771,298.667,0,303.437,0,309.333v149.333
                c0,5.896,4.771,10.667,10.667,10.667H160c5.896,0,10.667-4.771,10.667-10.667v-21.333
                C170.667,431.438,165.896,426.667,160,426.667z"
                />
            </svg>
        </div>
    </div>`
)
export class ToolboxComponent {
    target: HTMLElement
    c: ContainerComponent
    exportBtn: HTMLElement
    fullscreenBtn: HTMLElement
    fullscreenTarget: HTMLElement

    constructor(c: ContainerComponent) {
        this.c = c
        this.exportBtn = this.target.querySelector('.player-export') as HTMLButtonElement
        this.exportBtn.addEventListener('click', this.export)

        this.fullscreenBtn = this.target.querySelector('.player-fullscreen') as HTMLButtonElement
        this.fullscreenTarget = (this.c.container.parentNode as ShadowRoot).host as HTMLElement

        this.fullscreenTarget.addEventListener('fullscreenchange', () => this.cancelFullScreen())
        this.fullscreenBtn.addEventListener('click', () => this.setFullScreen())
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

    setFullScreen(this: ToolboxComponent) {
        this.c.resize({ maxScale: 100 })
        this.fullscreenTarget.requestFullscreen()
    }

    cancelFullScreen() {
        if (document.fullscreen) {
            return
        }
        this.c.resize({ maxScale: 1 })
    }
}
