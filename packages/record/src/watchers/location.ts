import { getTime, nodeStore, uninstallStore } from '@timecat/utils'
import { WatcherOptions, LocationRecord, RecordType } from '@timecat/share'
import { Watcher } from './watcher'

export class LocationWatcher extends Watcher<LocationRecord> {
    constructor(options: WatcherOptions<LocationRecord>) {
        super(options)
        this.init()
    }

    init() {
        history.pushState = this.kidnapLocation('pushState')
        history.replaceState = this.kidnapLocation('replaceState')

        const types = ['replaceState', 'pushState', 'hashchange']

        types.forEach(type => this.toggleListener('add', type, this.locationHandle))

        uninstallStore.add(() => {
            types.forEach(type => this.toggleListener('rm', type, this.locationHandle))
        })
    }

    toggleListener(methodType: 'add' | 'rm', type: string, handle: EventListenerOrEventListenerObject) {
        this.context[methodType === 'add' ? 'addEventListener' : 'removeEventListener'](type, handle)
    }

    kidnapLocation(type: 'pushState' | 'replaceState') {
        var original = this.context.history[type]

        return function(this: any) {
            const e = new Event(type)
            e.arguments = arguments
            this.context.dispatchEvent(e)
            original.apply(this, arguments)
        }
    }

    locationHandle(e: Event) {
        const contextNodeId = this.getContextNodeId(e)
        const [data, title, path] = e.arguments
        const { href, hash } = this.context.location
        this.emit({
            type: RecordType.LOCATION,
            data: {
                contextNodeId,
                href,
                hash,
                path
            },
            time: getTime().toString()
        })
    }

    getContextNodeId(e: Event) {
        return nodeStore.getNodeId((e.target as Window).document.documentElement)!
    }
}
