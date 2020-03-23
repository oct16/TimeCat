let time = 0
let timer: NodeJS.Timeout

function updateIcon() {
    if (!time) {
        chrome.browserAction.setIcon({ path: getIconPath('red') })
        sendMessageToContentScript({ type: 'start' })
    } else {
        time = 0
        clearInterval(timer)
        chrome.browserAction.setIcon({ path: getIconPath('black') })
        chrome.browserAction.setBadgeText({ text: '' })
        sendMessageToContentScript({ type: 'finish' })
        return
    }
    timer = setInterval(timeHandle, 1000)
    timeHandle()
}

function timeHandle() {
    const text = secondToDate(time)
    chrome.browserAction.setBadgeText({ text })
    time++
}

chrome.browserAction.onClicked.addListener(updateIcon)

function getIconPath(iconName: string) {
    return 'record-icon-' + iconName + '.png'
}

function secondToDate(second: number) {
    if (second <= 0) {
        second = 0
    }
    const [h, m, s] = [Math.floor(second / 3600), Math.floor((second / 60) % 60), Math.floor(second % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00:/, '')
}

function sendMessageToContentScript(request: any, callback?: Function) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, request, response => {
            if (callback) {
                callback(response)
            }
        })
    })
}
