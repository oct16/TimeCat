export function secondToDate(ms: number) {
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]

    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')

    return timeStr.replace(/^00\:/, '')
}
