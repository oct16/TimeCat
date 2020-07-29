import { emitterHook, getTime, nodeStore, uninstallStore, getStrDiffPatches } from '@timecat/utils'
import { WatcherOptions, FormElementEvent, RecordType, FormElementRecord } from '@timecat/share'

export function FormElementWatcher(options: WatcherOptions<FormElementRecord>) {
    listenInputs(options)

    // for sys write in input
    kidnapInputs(options)
}

function listenInputs(options: WatcherOptions<FormElementRecord>) {
    const { emit, context } = options

    const eventTypes = ['input', 'change', 'focus', 'blur']

    eventTypes
        .map(type => (fn: (e: InputEvent) => void) => {
            context.document.addEventListener(type, fn, { once: false, passive: true, capture: true })
        })
        .forEach(handle => handle(handleFn))

    uninstallStore.add(() => {
        eventTypes.forEach(type => {
            context.document.removeEventListener(type, handleFn, true)
        })
    })

    function handleFn(e: InputEvent) {
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
                    type: RecordType.FORM_EL_UPDATE,
                    data: {
                        type: eventType === 'input' ? FormElementEvent.INPUT : FormElementEvent.CHANGE,
                        id: nodeStore.getNodeId(e.target as Node)!,
                        key,
                        value: !patches.length ? newValue : value,
                        patches
                    },
                    time: getTime().toString()
                }
                break
            case 'focus':
                data = {
                    type: RecordType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.FOCUS,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                }
                break
            case 'blur':
                data = {
                    type: RecordType.FORM_EL_UPDATE,
                    data: {
                        type: FormElementEvent.BLUR,
                        id: nodeStore.getNodeId(e.target as Node)!
                    },
                    time: getTime().toString()
                }
                break
            default:
                break
        }

        emitterHook(emit, data)
    }
}

function kidnapInputs(options: WatcherOptions<FormElementRecord>) {
    const { emit, context } = options
    const elementList: [HTMLElement, string][] = [
        [(context as any).HTMLInputElement.prototype, 'value'],
        [(context as any).HTMLInputElement.prototype, 'checked'],
        [(context as any).HTMLSelectElement.prototype, 'value'],
        [(context as any).HTMLTextAreaElement.prototype, 'value']
    ]

    const handles = elementList.map(item => {
        return () => {
            const [target, key] = item
            const original = (context as any).Object.getOwnPropertyDescriptor(target, key)
            ;(context as any).Object.defineProperty(target, key, {
                set: function(value: string | boolean) {
                    setTimeout(() => {
                        handleEvent.call(this, key, value)
                    })
                    if (original && original.set) {
                        original.set.call(this, value)
                    }
                }
            })

            uninstallStore.add(() => {
                if (original) {
                    ;(context as any).Object.defineProperty(target, key, original)
                }
            })
        }
    })

    handles.concat([]).forEach(handle => handle())

    function handleEvent(this: HTMLElement, key: string, value: string) {
        const data = {
            type: FormElementEvent.PROP,
            id: nodeStore.getNodeId(this)!,
            key,
            value
        }

        emit({
            type: RecordType.FORM_EL_UPDATE,
            data,
            time: getTime().toString()
        })
    }
}
