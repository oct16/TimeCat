import { WatcherOptions, LocationRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class LocationWatcher extends Watcher<LocationRecord> {
    constructor(options: WatcherOptions<LocationRecord>) {
        super(options)
        this.init()
    }

    init() {
        this.context.history.pushState = this.kidnapLocation('pushState')
        this.context.history.replaceState = this.kidnapLocation('replaceState')

        const types = ['replaceState', 'pushState', 'popstate', 'hashchange']

        types.forEach(type => this.toggleListener('add', type, this.locationHandle))

        this.uninstall(() => {
            types.forEach(type => this.toggleListener('rm', type, this.locationHandle))
        })
    }

    toggleListener(methodType: 'add' | 'rm', type: string, handle: EventListenerOrEventListenerObject) {
        this.context[methodType === 'add' ? 'addEventListener' : 'removeEventListener'](type, handle)
    }

    kidnapLocation = (type: 'pushState' | 'replaceState') => {
        const ctx = this.context
        const original = ctx.history[type]

        return function (this: any) {
            const result = original.apply(this, arguments)
            const e = new Event(type)
            e.arguments = arguments
            ctx.dispatchEvent(e)
            return result
        }
    }

    locationHandle = (e: Event) => {
        const contextNodeId = this.getContextNodeId(e)
        const [, , path] = e.arguments || [, , this.context?.location?.pathname]
        const [base] = this.context.document.body.getElementsByTagName('base')
        const { href, hash } = this.context.location
        const title = document.title
        this.emitData(RecordType.LOCATION, {
            contextNodeId,
            href: base?.href || href,
            hash,
            path,
            title
        })
    }

    emitOne = () => this.locationHandle(({ target: window } as unknown) as Event)

    getContextNodeId(e: Event) {
        return this.getNodeId((e.target as Window).document.documentElement)!
    }
}
