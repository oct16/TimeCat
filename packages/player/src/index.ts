import { DBPromise, ProgressTypes, PlayerTypes, reduxStore, fmp } from '@WebReplay/utils'
import { ContainerComponent } from './container'
import { Panel } from './panel'
import pako from 'pako'

function getGZipStrData() {
    const data = window.__ReplayStrData__
    if (!data) {
        return null
    }
    const arrayData = (data.split(',') as unknown) as number[]
    const str = pako.ungzip(arrayData, {
        to: 'string'
    })
    return JSON.parse(str)
}

export async function replay() {
    const indexedDB = await DBPromise

    const { width, height, vNode, data } = (window.__ReplayData__ =
        getGZipStrData() || window.__ReplayData__ || (await indexedDB.getData()))
    const c = new ContainerComponent({ vNode, width, height })

    if (data.length) {
        fmp.ready(() => {
            new Panel(c, data)
            const startTime = data[0].time
            const endTime = data[data.length - 1].time
            reduxStore.dispatch({
                type: ProgressTypes.INFO,
                data: {
                    frame: 0,
                    curTime: startTime,
                    startTime,
                    endTime,
                    length: data.length
                }
            })

            reduxStore.dispatch({
                type: PlayerTypes.SPEED,
                data: { speed: 1 }
            })
        })
    } else {
        const panel = document.querySelector('.wr-panel')
        if (panel) {
            panel.setAttribute('style', 'display: none')
        }
    }
}
