const wr = (window as any).wr
let ctr: any

chrome.runtime.onMessage.addListener(request => {
    const { type } = request

    switch (type) {
        case 'start':
            record()
            break
        case 'finish':
            replay()
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

function replay() {
    const scriptUrl = chrome.runtime.getURL('replay.min.js')
    if (ctr) {
        wr.exportReplay({
            scripts: [scriptUrl],
            autoPlay: true
        })
        ctr.uninstall()
    }
}
