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
        if (this.subtitle.innerText.trim() === text.trim()) {
            return
        }

        this.subtitle.innerText = text
        if (text) {
            const span = document.createElement('span')
            span.innerHTML = '&nbsp;'
            this.subtitle.appendChild(span)
        }
    }
    cleanText() {
        this.updateText('')
    }
}
