/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { BroadcasterComponent } from './broadcaster'
import { ReplayInternalOptions } from '@timecat/share'
import { Component, IComponent, html } from '../utils'
import { ToolboxComponent } from './toolbox'

@Component(
    'player-panel',
    html`<div class="player-panel">
        <slot></slot>
    </div>`
)
export class PanelComponent implements IComponent {
    target: HTMLElement
    parent: HTMLElement
    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent
    broadcaster: BroadcasterComponent
    c: ContainerComponent
    options: ReplayInternalOptions

    constructor(c: ContainerComponent) {
        this.c = c
        this.options = c.options
        this.initComponent()
    }

    private initComponent() {
        new ToolboxComponent(this.options, this.c)
        this.keyboard = new KeyboardComponent(this.options, this.c)
        this.progress = new ProgressComponent(this.options, this.c)
        this.pointer = new PointerComponent(this.c)
        this.broadcaster = new BroadcasterComponent(this.c)
        this.player = new PlayerComponent(this.options, this.c, this.pointer, this.progress, this.broadcaster)
    }
}
