import { Keyboard } from './keyboard'
import { Player } from './player'
import { Pointer } from './pointer'
import { SnapshotData } from '@WebReplay/snapshot'

export class Panel {
    container: HTMLElement
    data: SnapshotData[]

    keyboard: Keyboard
    player: Player

    constructor(container: HTMLElement, data: SnapshotData[]) {
        this.container = container
        this.data = data
        this.initComponent()
    }

    initComponent() {
        this.keyboard = new Keyboard(this.container)
        this.player = new Player(this.data, new Pointer())
    }
}
