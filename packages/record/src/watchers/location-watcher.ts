import { getTime, nodeStore, listenerStore } from '@timecat/utils'
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

  function pathHandle(e: Event) {
      const contextNodeId = getContextNodeId(e)
      const [data, title, path] = e.arguments
      emit({
          type: RecordType.LOCATION,
          data: {
              contextNodeId,
              path
          },
          time: getTime().toString()
      })
  }
  function hashHandle(e: HashChangeEvent) {
      const contextNodeId = getContextNodeId(e)
      const newHash = e.newURL.split('#')[1]
      if (newHash) {
          emit({
              type: RecordType.LOCATION,
              data: {
                  contextNodeId,
                  hash: newHash
              },
              time: getTime().toString()
          })
      }
  }
  function getContextNodeId(e: Event) {
      return nodeStore.getNodeId((e.target as Window).document.documentElement)!
  }
  context.addEventListener('replaceState', pathHandle)
  context.addEventListener('pushState', pathHandle)
  context.addEventListener('hashchange', hashHandle)

  listenerStore.add(() => {
      context.removeEventListener('replaceState', pathHandle)
      context.removeEventListener('pushState', pathHandle)
      context.removeEventListener('hashchange', hashHandle)
  })
}