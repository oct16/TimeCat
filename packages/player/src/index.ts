import { dbPromise } from '@WebReplay/snapshot'
import { Container } from './container'
import { Player } from './player'
import { Pointer } from './pointer'
import { Panel } from './panel'

export async function replay() {
    const indexDB = await dbPromise
    const { width, height, vNode, data } = await indexDB.getData()

    document.documentElement.innerHTML = ''

    const contain = new Container({
        vNode,
        width,
        height
    })

    const panel = new Panel(contain.container)

    const player = new Player(data, new Pointer())
    panel.listenCommand(command => {
        panel.command(command)
        player.command(command)
    })

    panel.control.play()
}
