function windowSnapshot() {
    const href = window.location.href
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

    return {
        w,
        h,
        href
    }
}

function DOMSnapshot() {
    const domParser = new window.DOMParser()
    return domParser.parseFromString(
        `
        `,
        'text/html'
    )
}

export const screenshot = {
    windowSnapshot,
    DOMSnapshot
}
