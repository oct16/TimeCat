import { DBPromise, ProgressTypes, PlayerTypes, reduxStore, fmp } from '@WebReplay/utils'
import { ContainerComponent } from './container'
import { Panel } from './panel'
import pako from 'pako'
import io from 'socket.io-client'
import { InfoData, WindowObserveData, DOMSnapshotData, SnapshotData } from '@WebReplay/snapshot'

type KeyOf<T> = keyof T
type BaseType = { [key in KeyOf<InfoData & WindowObserveData & DOMSnapshotData>]: any } & { data: SnapshotData[] }

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

function dispatchEvent(type: string, data: SnapshotData) {
    event = new CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
}

function getAsyncDataBySocket(uri: string): Promise<BaseType> {
    var socket = io(uri)
    let base: BaseType = {} as BaseType

    return new Promise(resolve => {
        let isSent = false
        socket.on('record-data', (data: SnapshotData) => {
            const { doctype, width, vNode } = base
            if (!isSent) {
                base = { ...base, ...data.data }
            } else {
                dispatchEvent('record-data', data)
                return
            }

            if (doctype && width && vNode) {
                resolve({ ...base, data: [] } as BaseType)
                fmp.observe()
                isSent = true
            }
        })
    })
}

export async function replay(options: { socketUrl?: string } = {}) {
    const { socketUrl } = options

    const indexedDB = await DBPromise

    const { width, height, doctype, vNode, data } = (window.__ReplayData__ =
        (socketUrl && (await getAsyncDataBySocket(socketUrl))) ||
        getGZipStrData() ||
        window.__ReplayData__ ||
        (await indexedDB.getData()))

    const c = new ContainerComponent(vNode, { width, height, doctype })

    fmp.ready(() => {
        new Panel(c, data)

        if (data.length) {
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
        }
    })

    if (!data.length) {
        const panel = document.querySelector('.wr-panel')
        if (panel) {
            panel.setAttribute('style', 'display: none')
        }
    }
}
