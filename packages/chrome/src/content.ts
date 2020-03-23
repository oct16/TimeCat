console.log('load content')

const wr = (window as any).wr
let ctr: any

chrome.runtime.onMessage.addListener(request => {
    const { type } = request

    switch (type) {
        case 'start':
            record()
            break
        case 'finish':
            exportReplay()
            break
    }
})

function record() {
    const { DB, record } = wr
    DB.then((db: any) => {
        db.clear()
        ctr = record({
            emitter: (data: any) => {
                db.add(data)
            }
        })
    })
}

function exportReplay() {
    const scriptUrl = chrome.runtime.getURL('replay.min.js')
    if (ctr) {
        wr.exportReplay({
            injectScripts: [scriptUrl]
        })
        ctr.uninstall()
    }
}
