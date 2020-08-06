import { WatcherOptions, CanvasRecord, RecordType } from '@timecat/share'
import { Watcher } from './watcher'

type Prop = keyof CanvasRenderingContext2D

export class CanvasWatcher extends Watcher<CanvasRecord> {
    constructor(options: WatcherOptions<CanvasRecord>) {
        super(options)
        this.init()
    }

    init() {
        const self = this
        const canvasElements = document.getElementsByTagName('canvas')
        Array.from(canvasElements).forEach(canvas => {
            const dataURL = canvas.toDataURL()
            this.emitterHook({
                type: RecordType.CANVAS,
                data: {
                    id: this.getNodeId(canvas)!,
                    src: dataURL
                },
                time: this.getRadix64TimeStr()
            })
        })

        const ctxProto = CanvasRenderingContext2D.prototype
        const names = Object.getOwnPropertyNames(ctxProto)

        names.forEach(name => {
            const original = Object.getOwnPropertyDescriptor(ctxProto, name)!
            const method = original.value

            if (name === 'canvas') {
                return
            }

            Object.defineProperty(ctxProto, name, {
                get() {
                    const context = this
                    const id = this.getNodeId(this.canvas)!

                    return typeof method === 'function'
                        ? function() {
                              const args = [...arguments]
                              if (name === 'drawImage') {
                                  args[0] = id
                              }

                              self.aggregateDataEmitter(id, name, args)
                              return method.apply(context, arguments)
                          }
                        : null
                },
                set: function(value: any) {
                    const id = this.getNodeId(this.canvas)!
                    self.aggregateDataEmitter(id, name, value)

                    return original.set?.apply(this, arguments)
                }
            })

            this.uninstall(() => {
                Object.defineProperty(ctxProto, name, original)
            })
        })
    }

    aggregateDataEmitter = this.aggregateManager((id: number, strokes: { name: Prop; args: any[] }[]) => {
        this.emitterHook({
            type: RecordType.CANVAS,
            data: {
                id,
                strokes
            },
            time: this.getRadix64TimeStr()
        })
    }, 100)

    aggregateManager(func: Function, wait: number): any {
        const tasks = Object.create(null) as { [key: number]: { name: Prop; args: any[] }[] }
        const timeouts = Object.create(null) as { [key: number]: number }

        const blockInstances = [CanvasGradient]

        return function(this: any, id: number, prop: Prop, args: any) {
            const context = this

            function emitData(id: number) {
                const timeout = timeouts[id]
                clearTimeout(timeout)
                timeouts[id] = 0
                const strokes = tasks[id].slice()
                // TODO have problem here
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

            if (!blockInstances.some(instance => args instanceof instance)) {
                tasks[id].push({
                    name: prop,
                    args
                })
            }

            if (!timeouts[id]) {
                const timeout = window.setTimeout(() => {
                    emitData(id)
                }, wait)
                timeouts[id] = timeout
            }
        }
    }
}
