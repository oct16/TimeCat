/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import diff from 'diff'
import { radix64 } from '../performance/radix64'
import { VNode, VSNode, SnapshotRecord, RecordData, RecordType } from '@timecat/share'

export const isDev = process.env.NODE_ENV === 'development'

export const version = '__VERSION__'

export function logError(e: Error | string): string {
    const msg = (e as Error).message || (e as string)
    console.error(`TimeCat Error: ${msg}`)
    return msg
}

export function logWarn(e: Error | string): string {
    const msg = (e as Error).message || (e as string)
    console.warn(`TimeCat Warning: ${msg}`)
    return msg
}

export function logAdvice(msg: string): string {
    console.log(`%c TimeCat Advice: ${msg}`, 'color:#0f0;')
    return msg
}

export function getTime(): number {
    return Math.floor(performance.timing.navigationStart + performance.now())
}

export function getRadix64TimeStr() {
    return radix64.btoa(getTime())
}

export function getRandomCode(len: 6 | 7 | 8 = 8) {
    const code = (Math.random() * 20 + 16).toString(36).substring(2, len + 2)
    return code.toUpperCase()
}

export function secondToTime(second: number) {
    if (second <= 0) {
        second = 0
    }
    const [h, m, s] = [Math.floor(second / 3600), Math.floor((second / 60) % 60), Math.floor(second % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}

export function getDateTime(timestamp: number) {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = '0' + date.getMinutes()
    const seconds = '0' + date.getSeconds()
    const formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)
    return formattedTime
}

export function toTimeStamp(timeStr: string) {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
        const [min, sec] = parts
        return (+min * 60 + +sec) * 1000
    }

    const [hour, min, sec] = parts
    return (+hour * 3600 + +min * 60 + +sec) * 1000
}

export function isSnapshot(frame: RecordData) {
    return (frame as SnapshotRecord).type === RecordType.SNAPSHOT && !(frame as SnapshotRecord).data.frameId
}

export async function delay(t = 200): Promise<void> {
    return new Promise(r => {
        setTimeout(() => r(), t)
    })
}
export function isVNode(n: VNode | VSNode) {
    return !!(n as VNode).tag
}

export function getStrDiffPatches(oldStr: string, newStr: string) {
    return getPatches(diff.diffChars(oldStr, newStr))
}

export function revertStrByPatches(str: string, changes: ReturnType<typeof getStrDiffPatches>) {
    changes.forEach((change: any) => {
        const { type, value, len } = change
        switch (type) {
            case 'add':
                str = str.substring(0, change.index) + value + str.substring(change.index)
                break
            case 'rm':
                str = str.substring(0, change.index) + str.substring(change.index + len)
                break
        }
    })
    return str
}

function getPatches(changes: diff.Change[]) {
    let index = 0
    const patches = changes
        .map(change => {
            const { added: add, removed: rm, value, count } = change
            const len = count || 0
            if (add) {
                const ret = {
                    index,
                    type: 'add',
                    value
                }
                index += len
                return ret
            } else if (rm) {
                const ret = {
                    index,
                    type: 'rm',
                    len
                }
                return ret
            }
            index += len
        })
        .filter(Boolean)

    return patches as Array<{
        index: number
        type: 'add' | 'rm'
        value?: string
        len?: number
    }>
}

export function isNumeric(n: string) {
    return !isNaN(parseFloat(n)) && isFinite(parseFloat(n))
}

export function throttle(
    func: Function,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = { leading: false, trailing: false }
): any {
    let context: any
    let args: any
    let result: any
    let timeout: any = null
    let previous = 0

    const later = function () {
        previous = options.leading === false ? 0 : Date.now()
        timeout = null
        result = func.apply(context, args)
        if (!timeout) context = args = null
    }
    return function (this: any) {
        const now = Date.now()
        if (!previous && options.leading === false) previous = now
        const remaining = wait - (now - previous)
        context = this
        args = arguments
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            }
            previous = now
            result = func.apply(context, args)
            if (!timeout) context = args = null
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining)
        }
        return result
    }
}

type Procedure = (...args: any[]) => void

type Options = {
    isImmediate?: boolean
}

export function debounce<F extends Procedure>(
    func: F,
    waitMilliseconds: number,
    options: Options = {
        isImmediate: false
    }
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
        const context = this

        const doLater = function () {
            timeoutId = undefined
            if (!options.isImmediate) {
                func.apply(context, args)
            }
        }

        const shouldCallNow = options.isImmediate && timeoutId === undefined

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(doLater, waitMilliseconds)

        if (shouldCallNow) {
            func.apply(context, args)
        }
    }
}

export function createURL(url: string, base?: string) {
    try {
        return new URL(url, base)
    } catch (e) {
        logError(e)
    }
    return { href: url, pathname: url }
}

export function stateDebounce<T extends string | boolean | number>(
    stateHandle: (setState: (state: T) => void) => void,
    delay: ((state: T) => number) | number,
    initState?: T
) {
    let preState = initState
    let timer = 0
    return (cb: (state: T) => void) => {
        stateHandle(delayExec)

        function delayExec(state: T) {
            if (timer) {
                clearTimeout(timer)
            }

            timer = window.setTimeout(
                () => {
                    if (preState === state) {
                        return
                    }
                    cb(state)
                    preState = state
                    clearTimeout(timer)
                    timer = 0
                },
                typeof delay === 'number' ? delay : delay(state)
            )
        }
    }
}

export function logAsciiLogo() {
    /* eslint-disable */
    return console.log(
        `%c
______ _                _____       _   
|_   _(_)              /  __ \\     | |  
  | |  _ _ __ ___   ___| /  \\/ __ _| |_ 
  | | | | '_ \` _ \\ / _ \\ |    / _\` | __|
  | | | | | | | | |  __/ \\__/\\ (_| | |_ 
  \\_/ |_|_| |_| |_|\\___|\\____/\\__,_|\\__|
    `,
        'color: #1475b2;'
    )
}

export function logBadge(opts: { title: string; content: string; titleColor?: string; backgroundColor?: string }) {
    const { title, content, titleColor, backgroundColor } = opts
    const tColor = titleColor || '#606060'
    const bColor = backgroundColor || '#1475b2'

    const args = [
        '%c '.concat(title, ' %c ').concat(content, ' '),
        'padding: 1px; border-radius: 3px 0 0 3px; color: #fff; background: '.concat(tColor, ';'),
        'padding: 1px; border-radius: 0 3px 3px 0; color: #fff; background: '.concat(bColor, ';')
    ]
    console.log.apply(void 0, args)
}

export function logInfo() {
    logAsciiLogo()
    logBadge({ title: 'version', content: version })
    logBadge({ title: 'more info', content: 'github.com/oct16/timecat' })
}

export function removeGlobalVariables() {
    const keys = Object.keys(window)
    const targetKeys = keys.filter(key => {
        if (key) {
            if (key.startsWith('G_RECORD') || key.startsWith('G_REPLAY')) {
                return true
            }
        }
    }) as (keyof Window)[]

    targetKeys.forEach(key => {
        delete window[key]
    })
}

export const tempEmptyFn = () => {}
export const tempEmptyPromise = () => Promise.resolve()
