export const isDev = process.env.NODE_ENV === 'development'

export function logger(data: any) {
    console.log('record', data)
}

export function getTime() {
    return performance.timing.navigationStart + performance.now()
}

export function secondToDate(ms: number) {
    if (ms <= 0) {
        ms = 0
    }
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}
