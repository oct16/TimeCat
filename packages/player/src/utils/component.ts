/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parseHtmlStr } from '.'

export interface IComponent {
    parent: HTMLElement
    target: HTMLElement
}

export function Component(name: string, html: string, opts?: Partial<{ isShadow: boolean }>) {
    return function (constructor: Function) {
        customElements.define(
            name,
            class extends HTMLElement {
                constructor() {
                    super()
                    const child = parseHtmlStr(html)[0]
                    constructor.prototype.target = child

                    const slot = child.getElementsByTagName('slot')[0]

                    if (slot && this.children?.length > 0) {
                        const parent = slot.parentElement
                        ;[...this.children].forEach(el => parent?.insertBefore(el, null))
                        parent?.removeChild(slot)
                    }

                    if (opts?.isShadow) {
                        this.attachShadow({ mode: 'open' }).append(child)
                    } else {
                        this.parentElement?.replaceChild(child, this)
                    }

                    constructor.prototype.parent = child.parentElement
                }
            }
        )
    }
}

/**
 * for vscode lit-html
 * highlight tagged string template
 * @param str
 */
export const html = function (strings: TemplateStringsArray, ...values: any) {
    let str = ''
    strings.forEach((string, i) => {
        str += string + (values[i] || '')
    })
    return str
}
