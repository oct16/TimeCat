;(function retrieveMO(target) {
    if (!target.MutationObserver) {
        var frame = document.createElement('iframe')!
        document.body.appendChild(frame)
        target.MutationObserver = (frame.contentWindow as any).MutationObserver
        document.body.removeChild(frame)
    }
})(window)

export {}
