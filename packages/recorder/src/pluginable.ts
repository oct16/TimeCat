/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SyncHook } from 'tapable'
import { RecordOptions } from './recorder'
import { logError } from '@timecat/utils'
import { Watcher } from './watcher'

export interface RecorderPlugin {
    apply(recorder: Pluginable): void
}

enum HookStatus {
    beforeRun = 'beforeRun',
    run = 'run',
    emit = 'emit',
    end = 'end'
}

type IHOOK = Record<HookStatus, SyncHook<any, any, any>>

export class Pluginable {
    protected hooks: IHOOK
    private defaultPlugins: RecorderPlugin[] = [] // todo
    public pluginWatchers: typeof Watcher[] = []

    constructor(options?: RecordOptions) {
        this.initPlugin(options)

        const DEFAULT_HOOKS = {
            beforeRun: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(['data']),
            end: new SyncHook()
        }

        const HOOKS = this.checkHookAvailable()
            ? DEFAULT_HOOKS
            : Object.keys(DEFAULT_HOOKS).reduce((obj, key) => {
                  return { ...obj, [key]: () => {} }
              }, {} as { [key in keyof typeof DEFAULT_HOOKS]: any })

        this.hooks = HOOKS
    }

    public checkHookAvailable = () => {
        try {
            new SyncHook().call()
            return true
        } catch (error) {
            logError(`Plugin hooks is not available in the current env, because ${error}`)
        }
    }

    public plugin = (type: keyof IHOOK, cb: (data: any) => void) => {
        const name = this.hooks[type].constructor.name
        const method = /Async/.test(name) ? 'tapAsync' : 'tap'
        this.hooks[type][method](type, cb)
    }

    public use(plugin: RecorderPlugin): void {
        this.plugins.push(plugin)
    }

    private initPlugin(options?: RecordOptions) {
        const { plugins } = options || {}
        this.plugins.push(...this.defaultPlugins, ...(plugins || []))
    }

    protected loadPlugins() {
        this.plugins.forEach(plugin => {
            plugin.apply.call(plugin, this)
        })
    }

    private plugins: RecorderPlugin[] = []

    public addWatcher(watcher: typeof Watcher) {
        this.pluginWatchers.push(watcher)
    }
}
