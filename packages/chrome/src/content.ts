import { dispatchEvent, sendMessageToBackgroundScript } from './common'

const isDev = process.env.NODE_ENV === 'development'
const timeCatScript = isDev ? 'http://localhost:4321/timecat.min.js' : chrome.runtime.getURL('timecat.min.js')

chrome.runtime.onMessage.addListener(request => {
    const { type } = request
    switch (type) {
        case 'START':
            lazyInject(() => {
                dispatchEvent('CHROME_RECORD_START')
            })
            break
        case 'FINISH':
            dispatchEvent('CHROME_RECORD_FINISH', {
                scripts: [
                    {
                        name: 'time-cat',
                        src: timeCatScript
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

const injectMain = injectScriptOnce({
    name: 'time-cat',
    src: timeCatScript
})

const injectPageJS = injectScriptOnce({
    name: 'timecat-chrome-page',
    src: chrome.runtime.getURL('timecat-chrome-page.js')
})

function lazyInject(onLoadFn: () => void) {
    if (!window.document.getElementById('time-cat')) {
        Promise.all([new Promise(injectMain), new Promise(injectPageJS)]).then(() => {
            onLoadFn()
        })
    } else {
        onLoadFn()
    }
}

function injectScriptOnce(scriptItem: { name: string; src: string }) {
    let el: HTMLScriptElement | null = null

    return function(callback?: () => void) {
        const { name, src } = scriptItem

        const document = window.document
        if (el && callback) {
            callback()
            return el
        }

        if (document.getElementById(name)) {
            return el
        }

        const script = document.createElement('script')
        script.onload = () => {
            callback && callback()
        }
        script.id = name
        script.src = src
        el = script
        document.body.appendChild(script)
    }
}
