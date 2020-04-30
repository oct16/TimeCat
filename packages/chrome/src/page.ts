import { dispatchEvent } from './common'
import io from 'socket.io-client'

let ctrl: {
    unsubscribe: () => void
} | null

function record(e: Event) {
    const wr = window.wr
    const { record } = wr

    if (process.env.LIVE_MODE) {
        const socket = io('http://localhost:9528')
        ctrl = record(data => {
            socket.emit('record-msg', data)
        })
        return
    }

    ctrl = record()
}

function replay(e: Event & { detail: { scripts: { name: string; src: string }[] } }) {
    const wr = (window as any).wr
    if (ctrl) {
        const { scripts } = e.detail
        wr.exportReplay({
            scripts,
            autoPlay: true
        })
        ctrl.unsubscribe()
    }
}

function setWarn(handle?: () => void) {
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState == 'hidden') {
            if (ctrl) {
                ctrl.unsubscribe()
                ctrl = null
            }
            dispatchEvent('CHROME_RECORD_CANCEL')
        }
    })
}

window.addEventListener('CHROME_RECORD_START', record, false)
window.addEventListener('CHROME_RECORD_FINISH', replay, false)

setWarn()
