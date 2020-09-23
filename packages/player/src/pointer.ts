import { setAttribute } from '@timecat/virtual-dom'
import { delay } from '@timecat/utils'
import { ContainerComponent } from './container'

export class PointerComponent {
    x = 0
    y = 0

    pointer: HTMLElement
    c: ContainerComponent
    constructor(c: ContainerComponent) {
        this.c = c
        this.initPointer()
    }

    initPointer() {
        this.pointer = this.c.container.querySelector('#cat-pointer') as HTMLElement
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
        await delay(200)
        setAttribute(this.pointer, 'active', '')
        await delay(400)
        setAttribute(this.pointer, 'active', null)
    }
}
