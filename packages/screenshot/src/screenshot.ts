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
    // const docEl = document.documentElement.cloneNode(true);
    const domParser = new window.DOMParser()
    return domParser.parseFromString(
        `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <div class="container">
            test 123
        </div>
    </body>
    </html>`,
        'text/html'
    )
}

export const screenshot = {
    windowSnapshot,
    DOMSnapshot
}
