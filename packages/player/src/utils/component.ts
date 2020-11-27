export function Component(name: string, html: string, opts?: Partial<{ isShadow: boolean }>) {
    return function (constructor: Function) {
        customElements.define(
            name,
            class extends HTMLElement {
                constructor() {
                    super()
                    constructor.prototype.target = this
                    const temp = document.createElement('div')
                    temp.innerHTML = html
                    if (opts?.isShadow) {
                        this.attachShadow({ mode: 'open' }).append(...temp.childNodes)
                    } else {
                        this.append(...temp.childNodes)
                    }
                }
            }
        )
    }
}
