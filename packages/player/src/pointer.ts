import { setAttribute } from '@TimeCat/virtual-dom'
import { delay } from '@TimeCat/utils'

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

    async click(x: number, y: number) {
        this.move(x, y)
        if (this.pointer.hasAttribute('active')) {
            return
        }
        delay(100)
        setAttribute(this.pointer, 'active', '')
        await delay(400)
        setAttribute(this.pointer, 'active', null)
    }
}
