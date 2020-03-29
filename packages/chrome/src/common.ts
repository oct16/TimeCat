// for background and content
export function sendMessageToContentScript(request: any, callback?: Function) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, request, response => {
            if (callback) {
                callback(response)
            }
        })
    })
}
export function sendMessageToBackgroundScript(request: any, callback?: Function) {
    chrome.runtime.sendMessage(request, callback)
}

// for page and content
export function dispatchEvent(type: string, data: any = null) {
    event = new CustomEvent(type, { detail: data })
    window.dispatchEvent(event)
}
