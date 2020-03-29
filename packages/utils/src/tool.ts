const origin = ((window as any).__ReplayData__ && (window as any).__ReplayData__.origin) || location.origin
const protocol = origin.match(/.*?\/\//)[0] || location.protocol

export const isDev = process.env.NODE_ENV === 'development'

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
    if (isDev) {
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
            return origin + str
        }
        if (startsWithDoubleSlash(str)) {
            return protocol + str
        }
        return str
    })
}

export function completionAttrHref(str: string) {
    if (str.startsWith('data')) {
        return str
    }

    const reg = /^(\/{1,2}.*)/g
    str = str.replace(reg, str => {
        if (startsWithSlash(str)) {
            return origin + str
        }
        if (startsWithDoubleSlash(str)) {
            return protocol + str
        }
        return str
    })

    if (!/^http/.test(str)) {
        return origin + '/' + str
    }

    return str
}

export function logger(data: any) {
    console.info('record', data)
}
