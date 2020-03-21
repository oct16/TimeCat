var chrome

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#record').addEventListener('click', requestRecord)
})

function secondToDate(ms) {
    if (ms <= 0) {
        ms = 0
    }
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00:/, '')
}

var timer
var startTime
function requestRecord(e) {
    const btn = e.target
    const time = document.querySelector('time')
    const text = btn.innerText

    if (text === '录制') {
        btn.innerText = '暂停'
        if (!startTime) {
            startTime = +new Date()
        }
        timer = setInterval(() => {
            time.innerText = secondToDate((+new Date() - startTime) / 1000)
        }, 1000)
    } else {
        clearInterval(timer)
        startTime = 0
        time.innerText = '00:00'
        btn.innerText = '录制'
    }
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true
        },
        tabs => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type: 'RECORD'
                },
                res => {}
            )
        }
    )
}
