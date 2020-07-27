// TODO
// support inject mode
// uninstall watcher

import { emitterHook, nodeStore, getTime } from '@timecat/utils'
import { WatcherOptions, CanvasRecord, RecordType, ValueOf } from '@timecat/share'

type Prop = keyof CanvasRenderingContext2D

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

    const aggregateDataEmitter = aggregateManager((id: number, strokes: { name: Prop; args: any[] }[]) => {
        emitterHook(emit, {
            type: RecordType.CANVAS,
            data: {
                id,
                strokes
            },
            time: getTime().toString()
        })
    }, 200)

    const canvasPrototype = HTMLCanvasElement.prototype
    const original = Object.getOwnPropertyDescriptor(canvasPrototype, 'getContext')!

    canvasPrototype.getContext = function(...args: any[]) {
        return (proxy(original.value.call(this, args)) as unknown) as any
    }

    function proxy(ctx: CanvasRenderingContext2D) {
        const id = nodeStore.getNodeId(ctx.canvas)!

        const proxyHandler = {
            get: function(target: CanvasRenderingContext2D, prop: Prop) {
                const method = target[prop] as () => ValueOf<CanvasRenderingContext2D>
                return function() {
                    aggregateDataEmitter(id, prop, [...arguments])
                    return method.apply(ctx, arguments)
                }
            },
            set: function(target: CanvasRenderingContext2D, prop: Prop, value: any) {
                aggregateDataEmitter(id, prop, value)
                return Reflect.set(target, prop, value)
            }
        }

        return new Proxy(ctx, proxyHandler)
    }
}

function aggregateManager(func: Function, wait: number): any {
    const tasks = {} as { [key: number]: { name: Prop; args: any[] }[] }
    const timeouts = {} as { [key: number]: number }

    return function(this: any, id: number, prop: Prop, args: any) {
        const context = this

        function emitData(id: number) {
            const timeout = timeouts[id]
            clearTimeout(timeout)
            timeouts[id] = 0
            const strokes = tasks[id].slice()
            const clearIndex = strokes.reverse().findIndex(stroke => {
                if (stroke.name === 'clearRect') {
                    return true
                }
            })

            const aSliceOfShit = !~clearIndex ? strokes.reverse() : strokes.slice(0, clearIndex + 1).reverse()
            tasks[id].length = 0
            func.call(context, id, aSliceOfShit)
        }

        if (!tasks[id]) {
            tasks[id] = []
        }

        tasks[id].push({
            name: prop,
            args
        })

        if (!timeouts[id]) {
            const timeout = window.setTimeout(() => {
                emitData(id)
            }, wait)
            timeouts[id] = timeout
        }
    }
}
