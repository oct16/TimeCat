import { dispatchEvent, sendMessageToBackgroundScript } from './common'

const isDev = process.env.NODE_ENV === 'development'
const webReplayScript = isDev ? 'http://localhost:4321/replay.min.js' : chrome.runtime.getURL('replay.min.js')

chrome.runtime.onMessage.addListener(request => {
    const { type } = request
    switch (type) {
        case 'START':
            dispatchEvent('CHROME_RECORD_START')
            break
        case 'FINISH':
            dispatchEvent('CHROME_RECORD_FINISH', {
                scripts: [
                    {
                        name: 'web-replay',
                        src: webReplayScript
                    }
                ]
            })
            break
        case 'TAB_CHANGE':
            dispatchEvent('CHROME_TAB_CHANGE')
            break
    }
})

window.addEventListener('CHROME_RECORD_CANCEL', () =>
    sendMessageToBackgroundScript({
        type: 'RECORD_CANCEL'
    })
)

function injectScriptOnce(scriptItem: { name: string; src: string }, callback?: () => void) {
    let el: HTMLScriptElement | null = null

    return function() {
        const { name, src } = scriptItem

        const doc = window.document
        if (el && callback) {
            if (callback) callback()
            return el
        }

        if (document.getElementById(name)) {
            return
        }

        const s = doc.createElement('script')
        doc.body.appendChild(s)
        s.onload = () => callback && callback()
        s.id = name
        s.src = src
        el = s
    }
}

const injectMain = injectScriptOnce({
    name: 'web-replay',
    src: webReplayScript
})
const injectPageJS = injectScriptOnce({
    name: 'replay-chrome-page',
    src: chrome.runtime.getURL('replay-chrome-page.js')
})
injectMain()
injectPageJS()
