import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { BroadcasterComponent } from './broadcaster'
import { ReplayInternalOptions } from '@timecat/share/src'

export class Panel {
    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent
    broadcaster: BroadcasterComponent
    container: ContainerComponent
    options: ReplayInternalOptions

    constructor(container: ContainerComponent, options: ReplayInternalOptions) {
        this.container = container
        this.options = options
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new KeyboardComponent(this.container)
        this.progress = new ProgressComponent(this.container)
        this.pointer = new PointerComponent()
        this.broadcaster = new BroadcasterComponent()
        this.player = new PlayerComponent(this.options, this.container, this.pointer, this.progress, this.broadcaster)
    }
}
