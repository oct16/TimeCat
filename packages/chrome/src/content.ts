import { dispatchEvent, sendMessageToBackgroundScript } from './common'

const isDev = process.env.NODE_ENV === 'development'
const script = isDev ? 'http://localhost:4321/replay.min.js' : chrome.runtime.getURL('replay.min.js')

chrome.runtime.onMessage.addListener(request => {
    const { type } = request
    switch (type) {
        case 'START':
            dispatchEvent('CHROME_RECORD_START')
            break
        case 'FINISH':
            dispatchEvent('CHROME_RECORD_FINISH', {
                scripts: [script]
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

function injectScriptOnce(script: string, callback?: () => void) {
    let el: HTMLScriptElement | null = null

    return function() {
        const doc = window.document
        if (el && callback) {
            if (callback) callback()
            return el
        }

        const existingScripts = doc.body.getElementsByTagName('script')
        if (existingScripts) {
            const scripts = [].map
                .call(existingScripts, (s: HTMLElement) => s.getAttribute('src'))
                .filter(Boolean) as string[]
            if (scripts.includes(script)) {
                return
            }
        }
        const s = doc.createElement('script')
        doc.body.appendChild(s)
        s.onload = () => callback && callback()
        s.src = script
        el = s
    }
}

const injectMain = injectScriptOnce(script)
const injectPageJS = injectScriptOnce(chrome.runtime.getURL('replay-chrome-page.js'))
injectMain()
injectPageJS()
