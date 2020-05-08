import { DBPromise, ProgressTypes, PlayerTypes, reduxStore, fmp } from '@WebReplay/utils'
import { ContainerComponent } from './container'
import { Panel } from './panel'
import pako from 'pako'
import io from 'socket.io-client'
import { SnapshotData, snapshots } from '@WebReplay/snapshot'
import { RecordData } from '@WebReplay/record'

function getGZipStrData() {
    const data = window.__ReplayStrData__
    if (!data) {
        return null
    }
    const arrayData = (data.split(',') as unknown) as number[]
    const str = pako.ungzip(arrayData, {
        to: 'string'
    })
    const dataArray = JSON.parse(str)
    const [snapshot, ...records] = dataArray as [SnapshotData, ...RecordData[]]
    return {
        snapshot,
        records
    }
}

function dispatchEvent(type: string, data: RecordData) {
    event = new CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
}

async function getAsyncDataFromSocket(uri: string): Promise<{ snapshot: SnapshotData; records: [] }> {
    var socket = io(uri)
    return await new Promise(resolve => {
        let initialized = false
        socket.on('record-data', (data: SnapshotData | RecordData) => {
            if (initialized) {
                dispatchEvent('record-data', data as RecordData)
            } else {
                resolve({ snapshot: data as SnapshotData, records: [] })
                fmp.observe()
                initialized = true
            }
        })
    })
}

async function getDataFromDB() {
    const indexedDB = await DBPromise
    const data = await indexedDB.getRecords()
    const [snapshot, ...records] = data
    return {
        snapshot,
        records
    }
}

export async function replay(options: { socketUrl?: string } = {}) {
    const { socketUrl } = options
    const { snapshot, records } = (window.__ReplayData__ =
        (socketUrl && (await getAsyncDataFromSocket(socketUrl))) ||
        getGZipStrData() ||
        window.__ReplayData__ ||
        (await getDataFromDB()))
    const { vNode, width, height, doctype } = snapshot as SnapshotData
    const c = new ContainerComponent(vNode, { width, height, doctype })

    fmp.ready(() => {
        new Panel(c, records)

        if (records.length) {
            const startTime = records[0].time
            const endTime = records[records.length - 1].time
            reduxStore.dispatch({
                type: ProgressTypes.INFO,
                data: {
                    frame: 0,
                    curTime: startTime,
                    startTime,
                    endTime,
                    length: records.length
                }
            })

            reduxStore.dispatch({
                type: PlayerTypes.SPEED,
                data: { speed: 1 }
            })
        }
    })

    if (!records.length) {
        const panel = document.querySelector('.wr-panel')
        if (panel) {
            panel.setAttribute('style', 'display: none')
        }
    }
}
