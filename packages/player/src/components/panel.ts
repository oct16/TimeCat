import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { BroadcasterComponent } from './broadcaster'
import { ReplayInternalOptions } from '@timecat/share/src'
import { Component, IComponent } from '../utils/component'
import { ToolboxComponent } from './toolbox'

@Component(
    'player-panel',
    `<div class="player-panel">
        <slot></slot>
    </div>`,
    { replaceSlot: true }
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

    initComponent() {
        new ToolboxComponent(this.c)
        this.keyboard = new KeyboardComponent(this.options, this.c)
        this.progress = new ProgressComponent(this.c)
        this.pointer = new PointerComponent(this.c)
        this.broadcaster = new BroadcasterComponent(this.c)
        this.player = new PlayerComponent(this.options, this.c, this.pointer, this.progress, this.broadcaster)
    }
}
