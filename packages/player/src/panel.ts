import { EventBus } from './eventbus'

export class Panel {
    container: HTMLElement
    controller: HTMLElement

    event = new EventBus()

    constructor(container: HTMLElement) {
        this.container = container
        this.initCtrlPanel()
    }

    control = {
        play: () => {
            this.event.emit('command', 'play')
        },
        reload: () => {
            this.event.emit('command', 'reload')
        }
    }

    initCtrlPanel() {
        this.controller = this.container.querySelector('.wr-panel') as HTMLElement
        this.container.addEventListener('click', (e: MouseEvent) => {
            const target = e.target
            if (target) {
                const command = (target as HTMLElement).getAttribute('command')
                // this.command(command as any)
                this.event.emit('command', command)
            }
        })
    }

    listenCommand(callback: (command: string) => void) {
        return this.event.listen('command', callback)
    }

    command(c: string) {
        const pauseBtn = this.container.querySelector('.pause') as HTMLButtonElement
        const playBtn = this.container.querySelector('.play') as HTMLButtonElement
        const [x1, x4, x8] = this.container.querySelectorAll('.speed') as NodeListOf<HTMLButtonElement>
        switch (c) {
            case 'play':
                pauseBtn.removeAttribute('disabled')
                playBtn.setAttribute('disabled', '')
                break
            case 'pause':
                playBtn.removeAttribute('disabled')
                pauseBtn.setAttribute('disabled', '')
                break
            case 'x1':
                x8.removeAttribute('disabled')
                x4.removeAttribute('disabled')
                x1.setAttribute('disabled', '')
                break
            case 'x4':
                x8.removeAttribute('disabled')
                x1.removeAttribute('disabled')
                x4.setAttribute('disabled', '')
                break
            case 'x8':
                x1.removeAttribute('disabled')
                x4.removeAttribute('disabled')
                x8.setAttribute('disabled', '')
                // this.player.setSpeed(8)
                break
            default:
                break
        }
    }
}
