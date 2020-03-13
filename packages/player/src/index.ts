import { DBPromise, Redux } from '@WebReplay/utils'
import { Container } from './container'
import { Panel } from './panel'

export async function replay() {
    const indexDB = await DBPromise
    const { width, height, vNode, data } = await indexDB.getData()

    const box = new Container({ vNode, width, height })
    new Panel(box.container, data)

    Redux.dispatch({
        type: 'PLAY',
        data: {
            speed: 1
        }
    })
}
