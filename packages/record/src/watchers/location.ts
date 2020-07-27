import { getTime, nodeStore, uninstallStore } from '@timecat/utils'
import { WatcherOptions, LocationRecord, RecordType } from '@timecat/share'

export function LocationWatcher(options: WatcherOptions<LocationRecord>) {
    const { emit, context } = options

    function kidnapLocation(type: 'pushState' | 'replaceState') {
        var original = context.history[type]
        return function(this: any) {
            const e = new Event(type)
            e.arguments = arguments
            context.dispatchEvent(e)
            original.apply(this, arguments)
        }
    }

    history.pushState = kidnapLocation('pushState')
    history.replaceState = kidnapLocation('replaceState')

    function locationHandle(e: Event) {
        const contextNodeId = getContextNodeId(e)
        const [data, title, path] = e.arguments
        const { href, hash } = context.location
        emit({
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

    function getContextNodeId(e: Event) {
        return nodeStore.getNodeId((e.target as Window).document.documentElement)!
    }
    context.addEventListener('replaceState', locationHandle)
    context.addEventListener('pushState', locationHandle)
    context.addEventListener('hashchange', locationHandle)

    uninstallStore.add(() => {
        context.removeEventListener('replaceState', locationHandle)
        context.removeEventListener('pushState', locationHandle)
        context.removeEventListener('hashchange', locationHandle)
    })
}
