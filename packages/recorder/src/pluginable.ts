import { SyncHook } from 'tapable'
import { RecordOptions } from '@timecat/share'

const defaultPlugins: IPlugin[] = [] // todo

const HOOKS = {
    beforeRun: new SyncHook(),
    run: new SyncHook(),
    emit: new SyncHook(['data']),
    end: new SyncHook()
}

interface IPlugin {
    apply(plugin: Pluginable): void
}

export class Pluginable {
    constructor(options?: RecordOptions) {
        this.initPlugin(options)
    }

    private initPlugin(options?: RecordOptions) {
        const { plugins } = options || {}
        this.plugins.push(...defaultPlugins, ...(plugins || []))
        this.plugins.forEach(plugin => {
            plugin.apply(this)
        })
    }

    private plugins: IPlugin[] = []
    public hooks = HOOKS

    plugin(type: keyof typeof HOOKS, cb: (data: any) => void) {
        const name = this.hooks[type].constructor.name
        const method = /Async/.test(name) ? 'tapAsync' : 'tap'
        this.hooks[type][method](type, cb)
    }

    use(plugin: IPlugin): void {
        this.plugins.push(plugin)
        plugin.apply(this)
    }
}
