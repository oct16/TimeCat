import { setAttribute } from '@TimeCat/virtual-dom'

export class PointerComponent {
    x = 0
    y = 0

    pointer: HTMLElement
    constructor() {
        this.initPointer()
    }

    initPointer() {
        this.pointer = document.getElementById('cat-pointer') as HTMLElement
        this.move(0, 0)
    }

    move(x: number, y: number) {
        this.x = x
        this.y = y
        this.pointer.style.left = this.x + 'px'
        this.pointer.style.top = this.y + 'px'
    }

    click(x: number, y: number) {
        this.move(x, y)
        setAttribute(this.pointer, 'active', '')
        setTimeout(() => {
            setAttribute(this.pointer, 'active', null)
        }, 400)
    }
}
