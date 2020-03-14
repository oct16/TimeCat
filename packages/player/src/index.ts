import { DBPromise, ProgressTypes, PlayerTypes, reduxStore } from '@WebReplay/utils'
import { Container } from './container'
import { Panel } from './panel'

export async function replay() {
    const indexDB = await DBPromise
    const { width, height, vNode, data } = await indexDB.getData()

    const c = new Container({ vNode, width, height })
    new Panel(c.container, data)

    reduxStore.dispatch({
        type: ProgressTypes.INFO,
        data: {
            frame: 0,
            curTime: data[0].time,
            startTime: data[0].time,
            endTime: data[data.length - 1].time,
            length: data.length
        }
    })

    reduxStore.dispatch({
        type: PlayerTypes.SPEED,
        data: { speed: 1 }
    })
}
