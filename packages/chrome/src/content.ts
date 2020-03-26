// let ctr: any

chrome.runtime.onMessage.addListener(request => {
    let event: CustomEvent
    const { type } = request
    switch (type) {
        case 'start':
            event = new CustomEvent('CHROME_RECORD_START')
            window.dispatchEvent(event)
            break
        case 'finish':
            event = new CustomEvent('CHROME_RECORD_FINISH')
            window.dispatchEvent(event)
            break
    }
})

function injectScriptOnce(script: string, callback?: () => void) {
    let el: HTMLScriptElement | null = null

    return function() {
        if (el && callback) {
            callback()
        }
        const doc = window.document
        const s = doc.createElement('script')
        doc.body.appendChild(s)
        s.onload = () => callback && callback()
        s.src = script
        el = s
    }
}

const script =
    process.env.NODE_ENV === 'production'
        ? chrome.runtime.getURL('replay.min.js')
        : 'http://localhost:4321/replay.min.js'

const injectMain = injectScriptOnce(script)
const injectPageJS = injectScriptOnce(chrome.runtime.getURL('replay-chrome-page.js'))
injectMain()
injectPageJS()
