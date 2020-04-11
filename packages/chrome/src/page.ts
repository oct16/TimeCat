import { dispatchEvent } from './common'

let ctrl: any

function record(e: Event) {
    const wr = (window as any).wr
    const { DB, record } = wr

    DB.then((db: any) => {
        db.clear()
        ctrl = record({
            emitter: (data: any) => {
                db.add(data)
            }
        })
    })
}

function replay(e: Event & { detail: { scripts: { name: string; src: string }[] } }) {
    const wr = (window as any).wr
    if (ctrl) {
        const { scripts } = e.detail
        wr.exportReplay({
            scripts,
            autoPlay: true
        })
        ctrl.uninstall()
    }
}

function setWarn(handle?: () => void) {
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState == 'hidden') {
            if (ctrl) {
                ctrl.uninstall()
                ctrl = null
            }
            dispatchEvent('CHROME_RECORD_CANCEL')
        }
    })
}

window.addEventListener('CHROME_RECORD_START', record, false)
window.addEventListener('CHROME_RECORD_FINISH', replay, false)

setWarn()
