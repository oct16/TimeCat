import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'
import { RecordData } from '@TimeCat/record'

export class Panel {

    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent
    container: ContainerComponent

    constructor(container: ContainerComponent) {
        this.container = container
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new KeyboardComponent(this.container)
        this.progress = new ProgressComponent(this.container)
        this.pointer = new PointerComponent()
        this.player = new PlayerComponent(this.container, this.pointer, this.progress)
    }
}
