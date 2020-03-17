import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { ProgressComponent } from './progress'
import { ContainerComponent } from './container'

export class Panel {
    data: SnapshotData[]

    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent
    container: ContainerComponent

    constructor(container: ContainerComponent, data: SnapshotData[]) {
        this.container = container
        this.data = data
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new KeyboardComponent(this.container)
        this.progress = new ProgressComponent(this.container)
        this.pointer = new PointerComponent()
        this.player = new PlayerComponent(this.data, this.container, this.pointer, this.progress)
    }
}
