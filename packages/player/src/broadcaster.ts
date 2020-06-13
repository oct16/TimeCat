export class BroadcasterComponent {
    broadcaster: HTMLElement
    floatLayer: HTMLElement
    subtitle: HTMLElement
    constructor() {
        this.init()
    }

    init() {
        this.broadcaster = document.querySelector('.cat-broadcaster') as HTMLElement
        this.floatLayer = this.broadcaster.firstElementChild as HTMLElement
        this.subtitle = this.floatLayer.firstElementChild as HTMLElement
    }

    updateText(text: string) {
        text = text.trim()
        if (this.subtitle.innerText.trim() === text) {
            return
        }

        this.subtitle.innerText = text
        this.floatLayer.toggleAttribute('hidden', !text)
    }
    cleanText() {
        this.updateText('')
    }
}
