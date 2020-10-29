import { SyncHook } from 'tapable'
import { RecordOptions } from './recorder'
import { logError } from '@timecat/utils'

const defaultPlugins: RecorderPlugin[] = [] // todo

const checkHookAvailable = () => {
    try {
        new SyncHook().call()
        return true
    } catch (error) {
        logError(`Plugin hooks is not available in the current env, because ${error}`)
    }
}

const DEFAULT_HOOKS = {
    beforeRun: new SyncHook(),
    run: new SyncHook(),
    emit: new SyncHook(['data']),
    end: new SyncHook()
}
const HOOKS = checkHookAvailable()
    ? DEFAULT_HOOKS
    : Object.keys(DEFAULT_HOOKS).reduce((obj, key) => {
          return { ...obj, [key]: () => {} }
      }, {} as { [key in keyof typeof DEFAULT_HOOKS]: any })

export interface RecorderPlugin {
    apply(recorder: Pluginable): void
}

export class Pluginable {
    constructor(options?: RecordOptions) {
        this.initPlugin(options)
    }

    protected hooks = HOOKS

    public plugin = (type: keyof typeof HOOKS, cb: (data: any) => void) => {
        const name = this.hooks[type].constructor.name
        const method = /Async/.test(name) ? 'tapAsync' : 'tap'
        this.hooks[type][method](type, cb)
    }

    public use(plugin: RecorderPlugin): void {
        this.plugins.push(plugin)
    }

    private initPlugin(options?: RecordOptions) {
        const { plugins } = options || {}
        this.plugins.push(...defaultPlugins, ...(plugins || []))
    }

    protected pluginsOnload() {
        this.plugins.forEach(plugin => {
            plugin.apply.call(plugin, this)
        })
    }

    private plugins: RecorderPlugin[] = []
}
