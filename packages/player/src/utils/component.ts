export function Component(name: string, html: string, opts?: Partial<{ replaceSlot: boolean; isShadow: boolean }>) {
    return function (constructor: Function) {
        customElements.define(
            name,
            class extends HTMLElement {
                constructor() {
                    super()
                    const temp = document.createElement('div')
                    temp.innerHTML = html
                    const child = temp.firstElementChild!
                    constructor.prototype.target = child

                    if (opts?.replaceSlot && this.children?.length > 0) {
                        const slot = child.getElementsByTagName('slot')[0]
                        const parent = slot.parentElement
                        ;[...this.children].forEach(el => parent?.insertBefore(el, null))
                        parent?.removeChild(slot)
                    }

                    if (opts?.isShadow) {
                        this.attachShadow({ mode: 'open' }).append(child)
                    } else {
                        this.parentElement?.replaceChild(child, this)
                    }
                }
            }
        )
    }
}
