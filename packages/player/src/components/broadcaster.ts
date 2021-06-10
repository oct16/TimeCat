/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ContainerComponent } from './container'
import { Component, html, IComponent } from '../utils'

@Component(
    'player-broadcaster',
    html`<div class="player-broadcaster">
        <div class="float-layer" hidden>
            <span class="subtitle"></span>
        </div>
    </div>`
)
export class BroadcasterComponent implements IComponent {
    parent: HTMLElement
    target: HTMLElement
    broadcaster: HTMLElement
    floatLayer: HTMLElement
    subtitle: HTMLElement
    c: ContainerComponent
    constructor(container: ContainerComponent) {
        this.c = container
        this.init()
    }

    init() {
        this.broadcaster = this.c.container.querySelector('.player-broadcaster') as HTMLElement
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
