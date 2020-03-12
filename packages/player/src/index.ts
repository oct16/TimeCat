import { DBPromise, listenerStore, Redux } from '@WebReplay/utils'
import { Container } from './container'
import { Panel } from './panel'

export async function replay() {
    const indexDB = await DBPromise
    const { width, height, vNode, data } = await indexDB.getData()

    document.documentElement.innerHTML = ''

    Array.from(listenerStore.entries()).forEach(([name, handle]) => {
        document.removeEventListener(name, handle)
    })

    const contain = new Container({
        vNode,
        width,
        height
    })

    new Panel(contain.container, data)

    Redux.dispatch({
        type: 'PLAY',
        data: {
            speed: 1
        }
    })
}
