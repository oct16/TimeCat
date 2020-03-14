import { KeyboardComponent } from './keyboard'
import { PlayerComponent } from './player'
import { PointerComponent } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'
import { ProgressComponent } from './progress'

export class Panel {
    container: HTMLElement
    data: SnapshotData[]

    keyboard: KeyboardComponent
    progress: ProgressComponent
    pointer: PointerComponent
    player: PlayerComponent

    constructor(container: HTMLElement, data: SnapshotData[]) {
        this.container = container
        this.data = data
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new KeyboardComponent(this.container)
        this.progress = new ProgressComponent(this.container)
        this.pointer = new PointerComponent()
        this.player = new PlayerComponent(this.data, this.pointer, this.progress)
    }
}
