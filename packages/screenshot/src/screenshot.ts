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
    return document.cloneNode(true) as Document
}

export const screenshot = {
    windowSnapshot,
    DOMSnapshot
}
