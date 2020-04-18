import { dispatchEvent } from './common'

let ctrl: any

function record(e: Event) {
    const wr = (window as any).wr
    const { record } = wr
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
