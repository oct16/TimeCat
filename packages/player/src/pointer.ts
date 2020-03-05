export class Pointer {
    x: number = 0
    y: number = 0

    container: HTMLElement
    pointer: HTMLElement
    constructor(container: string | HTMLElement) {
        this.initContainer(container)
        this.init()
    }

    init() {
        this.initPointer()
    }

    initContainer(container: string | HTMLElement) {
        if (typeof container === 'string') {
            const c = document.getElementById(container)
            if (c) {
                this.container = c
            }
        } else {
            this.container = container
        }
        if (!this.container) {
            throw new Error('Pointer container is not define!')
        }
    }

    initPointer() {
        this.pointer = document.getElementById('wr-pointer') as HTMLElement
        this.move(0, 0)
    }

    move(x: number, y: number) {
        this.x = x
        this.y = y
        this.pointer.style.left = this.x + 10 + 'px'
        this.pointer.style.top = this.y + 30 + 'px'
    }

    click(x: number, y: number) {
        this.move(x, y)
        this.pointer.setAttribute('active', '')
        setTimeout(() => {
            this.pointer.removeAttribute('active')
        }, 100)
    }
}
