import { emitterHook, nodeStore, getTime } from '@timecat/utils'
import { WatcherOptions, CanvasRecord, RecordType, ValueOf } from '@timecat/share'

export function CanvasWatcher(options: WatcherOptions<CanvasRecord>) {
    const { emit, context } = options
    const canvasElements = document.getElementsByTagName('canvas')
    Array.from(canvasElements).forEach(canvas => {
        var dataURL = canvas.toDataURL()
        emitterHook(emit, {
            type: RecordType.CANVAS,
            data: {
                id: nodeStore.getNodeId(canvas)!,
                src: dataURL
            },
            time: getTime().toString()
        })
    })

    const canvasPrototype = HTMLCanvasElement.prototype
    const original = Object.getOwnPropertyDescriptor(canvasPrototype, 'getContext')!

    canvasPrototype.getContext = function(...args: any[]) {
        return (proxy(original.value.call(this, args)) as unknown) as any
    }

    function proxy(ctx: CanvasRenderingContext2D) {
        const proxyHandler = {
            get: function(target: CanvasRenderingContext2D, prop: keyof CanvasRenderingContext2D) {
                const method = target[prop] as () => ValueOf<CanvasRenderingContext2D>
                return function() {
                    emitterHook(emit, {
                        type: RecordType.CANVAS,
                        data: {
                            id: nodeStore.getNodeId(ctx.canvas)!,
                            name: prop,
                            args: [...arguments]
                        },
                        time: getTime().toString()
                    })
                    method.apply(ctx, arguments)
                }
            }
        }

        return new Proxy(ctx, proxyHandler)
    }
}
