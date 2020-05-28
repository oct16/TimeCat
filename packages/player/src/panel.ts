import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { BroadcasterComponent } from './broadcaster'

export class Panel {
    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent
    broadcaster: BroadcasterComponent
    container: ContainerComponent

    constructor(container: ContainerComponent) {
        this.container = container
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new KeyboardComponent(this.container)
        this.progress = new ProgressComponent(this.container)
        this.pointer = new PointerComponent()
        this.broadcaster = new BroadcasterComponent()
        this.player = new PlayerComponent(this.container, this.pointer, this.progress, this.broadcaster)
    }
}
