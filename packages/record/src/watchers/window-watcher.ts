import { emitterHook, registerEvent, getTime, nodeStore } from '@timecat/utils'
import { WatcherOptions, WindowRecord, RecordType } from '@timecat/share'

export function WindowWatcher(options: WatcherOptions<WindowRecord>) {
  const { emit, context } = options
  const width = () => context.innerWidth
  const height = () => context.innerHeight
  function emitData(target: Element | Document) {
      emitterHook(emit, {
          type: RecordType.WINDOW,
          data: {
              id: nodeStore.getNodeId(target) || null,
              width: width(),
              height: height()
          },
          time: getTime().toString()
      })
  }

  emitData(context.document)

  function handleFn(e: Event) {
      const { type, target } = e
      if (type === 'resize') {
          emitData(target as Element | Document)
      }
  }
  registerEvent({
      context,
      eventTypes: ['resize'],
      handleFn,
      listenerOptions: { capture: true },
      type: 'throttle',
      optimizeOptions: { trailing: true },
      waitTime: 500
  })
}