import { getStrDiffPatches } from '@timecat/utils'
import { WatcherOptions, FormElementEvent, RecordType, FormElementRecord } from '@timecat/share'
import { Watcher } from './watcher'

export class FormElementWatcher extends Watcher<FormElementRecord> {
    constructor(options: WatcherOptions<FormElementRecord>) {
        super(options)
        this.init()
    }

    init() {
        this.listenInputs(this.options)

        // for sys write in input
        this.kidnapInputs(this.options)
    }

    listenInputs(options: WatcherOptions<FormElementRecord>) {
        const { context } = options

        const eventTypes = ['input', 'change', 'focus', 'blur']

        eventTypes
            .map(type => (fn: (e: InputEvent) => void) => {
                context.document.addEventListener(type, fn, { once: false, passive: true, capture: true })
            })
            .forEach(handle => handle(handleFn.bind(this)))

        this.uninstall(() => {
            eventTypes.forEach(type => {
                context.document.removeEventListener(type, handleFn.bind(this), true)
            })
        })

        function handleFn(this: FormElementWatcher, e: InputEvent) {
            const eventType = e.type
            let data!: FormElementRecord
            switch (eventType) {
                case 'input':
                case 'change':
                    const target = (e.target as unknown) as HTMLInputElement
                    const inputType = target.getAttribute('type') || 'text'

                    let key = 'value'
                    let value: any = target.value || ''
                    let newValue: any = ''
                    let patches: ReturnType<typeof getStrDiffPatches> = []

                    if (inputType === 'checkbox' || inputType === 'radio') {
                        if (eventType === 'input') {
                            return
                        }
                        key = 'checked'
                        newValue = target.checked
                    } else {
                        if (value === target.oldValue) {
                            return
                        }
                        if (value.length <= 20 || !target.oldValue) {
                            newValue = value
                        } else {
                            patches.push(...getStrDiffPatches(target.oldValue, value))
                        }
                        target.oldValue = value
                    }

                    data = {
                        type: RecordType.FORM_EL,
                        data: {
                            type: eventType === 'input' ? FormElementEvent.INPUT : FormElementEvent.CHANGE,
                            id: this.getNodeId(e.target as Node)!,
                            key,
                            value: !patches.length ? newValue : value,
                            patches
                        },
                        time: this.getRadix64TimeStr()
                    }
                    break
                case 'focus':
                    data = {
                        type: RecordType.FORM_EL,
                        data: {
                            type: FormElementEvent.FOCUS,
                            id: this.getNodeId(e.target as Node)!
                        },
                        time: this.getRadix64TimeStr()
                    }
                    break
                case 'blur':
                    data = {
                        type: RecordType.FORM_EL,
                        data: {
                            type: FormElementEvent.BLUR,
                            id: this.getNodeId(e.target as Node)!
                        },
                        time: this.getRadix64TimeStr()
                    }
                    break
                default:
                    break
            }

            this.emitterHook(data)
        }
    }

    kidnapInputs(options: WatcherOptions<FormElementRecord>) {
        const { context } = options
        const self = this

        const elementList: [HTMLElement, string][] = [
            [context.HTMLInputElement.prototype, 'value'],
            [context.HTMLInputElement.prototype, 'checked'],
            [context.HTMLSelectElement.prototype, 'value'],
            [context.HTMLTextAreaElement.prototype, 'value']
        ]

        const handles = elementList.map(item => {
            return () => {
                const [target, key] = item
                const original = context.Object.getOwnPropertyDescriptor(target, key)
                context.Object.defineProperty(target, key, {
                    set: function(value: string | boolean) {
                        setTimeout(() => {
                            handleEvent.call(this, key, value)
                        })
                        if (original && original.set) {
                            original.set.call(this, value)
                        }
                    }
                })

                this.uninstall(() => {
                    if (original) {
                        context.Object.defineProperty(target, key, original)
                    }
                })
            }
        })

        handles.concat([]).forEach(handle => handle())

        function handleEvent(this: HTMLElement, key: string, value: string) {
            const data = {
                type: FormElementEvent.PROP,
                id: self.getNodeId(this)!,
                key,
                value
            }

            self.emitterHook({
                type: RecordType.FORM_EL,
                data,
                time: self.getRadix64TimeStr()
            })
        }
    }
}
