export function secondToDate(ms: number) {
    if (ms <= 0) {
        ms = 0
    }
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}

export function getTime() {
    return performance.timing.navigationStart + performance.now()
}

export function filteringTemplate(tpl: string) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    const isProd = process.env.NODE_ENV === 'production'
    if (!isProd) {
        tpl = tpl.replace(reg, '')
    }
    return tpl
}

export function filteringScriptTag(str: string) {
    const reg = /<\/script>/g
    return str.replace(reg, '<\\/script>')
}

function startsWithSlash(str: string) {
    return /^\/(?!\/)/.test(str)
}
function startsWithDoubleSlash(str: string) {
    return /^\/\//.test(str)
}

export function completionCssHref(str: string) {
    const reg = /(?<=url\()(\/{1,2}[^'"]*?)(?=\))/g
    return str.replace(reg, str => {
        if (startsWithSlash(str)) {
            return location.origin + str
        }
        if (startsWithDoubleSlash(str)) {
            return location.protocol + str
        }
        return str
    })
}

export function completionAttrHref(str: string) {
    const reg = /^(\/{1,2}.*)/g
    return str.replace(reg, str => {
        if (startsWithSlash(str)) {
            return location.origin + str
        }
        if (startsWithDoubleSlash(str)) {
            return location.protocol + str
        }
        return str
    })
}
