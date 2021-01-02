/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PlayerEventTypes } from '../types'

class Observer<T extends string> {
    id = 1
    listenersMap = new Map<T, Map<number, Function>>()

    on(key: T, fn: Function): number {
        const map = this.getListenersByKey(key)
        map.set(++this.id, fn)
        return this.id
    }

    emit(key: T, ...args: any): void {
        this.getListenersByKey(key).forEach(fn => {
            fn(...args)
        })
    }

    once(key: T, fn: Function): number {
        const onceFunc = (...args: any) => {
            fn(...args)
            this.off(key, id)
        }
        const id = this.on(key, onceFunc)
        return id
    }

    flush(key: T): void {
        this.getListenersByKey(key).clear()
    }

    destroy(): void {
        this.listenersMap.clear()
    }

    private off(key: T, id: number): void {
        const map = this.getListenersByKey(key)
        map.delete(id)
    }

    private getListenersByKey(key: T): Map<number, Function> {
        const map = this.listenersMap.get(key) || new Map<number, Function>()
        this.listenersMap.set(key, map)
        return map
    }
}

export const observer = new Observer<PlayerEventTypes>()
