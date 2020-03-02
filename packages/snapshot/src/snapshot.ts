import { virtualDOM } from '@WebReplay/virtual-dom'
import { SnapshotType, WindowSnapshot, DOMSnapshot, SnapshotEvent, MouseSnapshot } from './types'
import { throttle } from './utils'

function windowSnapshot(emit: SnapshotEvent<WindowSnapshot>) {
    const href = window.location.href
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

    emit({
        type: SnapshotType.WINDOW,
        data: {
            width,
            height,
            href
        }
    })
}

function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>) {
    emit({
        type: SnapshotType.DOM,
        data: {
            vNode: virtualDOM.convertHTML(document)
        }
    })
    return {
        type: SnapshotType.DOM,
        data: document.cloneNode(true) as Document
    }
}

function listenMouse(emit: SnapshotEvent<MouseSnapshot>) {
    function mouseMove() {
        const mEvtFn = (e: MouseEvent) => {
            emit({
                type: SnapshotType.MOUSE,
                data: {
                    x: e.x,
                    y: e.y,
                    time: Date.now().toString()
                }
            })
        }

        const throttledEvt = throttle(mEvtFn, 500)
        document.addEventListener('mousemove', throttledEvt)
    }

    mouseMove()
}

export const snapshot = {
    windowSnapshot,
    DOMSnapshot,
    listenMouse
}
