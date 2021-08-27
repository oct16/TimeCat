/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStrDiffPatches } from '@timecat/utils'
import { WatcherArgs, FormElementEvent, RecordType, FormElementRecord } from '@timecat/share'
import { Watcher } from '../watcher'

export class FormElementWatcher extends Watcher<FormElementRecord> {
    protected init() {
        this.listenInputs(this.options)
        this.hijackInputs(this.options)
    }

    private listenInputs(options: WatcherArgs<FormElementRecord>) {
        const { context } = options

        enum eventTypes {
            'input' = 'input',
            'change' = 'change',
            'focus' = 'focus',
            'blur' = 'blur'
        }

        const eventListenerOptions = { once: false, passive: true, capture: true }

        Object.values(eventTypes)
            .map(type => (fn: (e: InputEvent) => void) => {
                context.addEventListener(type, fn, eventListenerOptions)
                this.uninstall(() => context.removeEventListener(type, fn, eventListenerOptions))
            })
            .forEach(call => call(handleFn.bind(this)))

        function handleFn(this: FormElementWatcher, e: InputEvent) {
            const eventType = e.type
            let data!: FormElementRecord['data']
            switch (eventType) {
                case eventTypes.input:
                case eventTypes.change:
                    const target = (e.target as unknown) as HTMLInputElement
                    const inputType = target.getAttribute('type') || 'text'

                    let key = 'value'
                    const value: any = target.value || ''
                    let newValue: any = ''
                    const patches: ReturnType<typeof getStrDiffPatches> = []

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
                        type: eventType === 'input' ? FormElementEvent.INPUT : FormElementEvent.CHANGE,
                        id: this.getNodeId(e.target as Node)!,
                        key,
                        value: !patches.length ? newValue : null,
                        patches
                    }
                    break
                case eventTypes.focus:
                    data = {
                        type: FormElementEvent.FOCUS,
                        id: this.getNodeId(e.target as Node)!
                    }
                    break
                case eventTypes.blur:
                    data = {
                        type: FormElementEvent.BLUR,
                        id: this.getNodeId(e.target as Node)!
                    }
                    break
                default:
                    break
            }

            this.emitData(RecordType.FORM_EL, data)
        }
    }

    private hijackInputs(options: WatcherArgs<FormElementRecord>) {
        const { context } = options
        const self = this
        function handleEvent(this: HTMLElement, key: string, value: string) {
            const data = {
                type: FormElementEvent.PROP,
                id: self.getNodeId(this)!,
                key,
                value
            }

            self.emitData(RecordType.FORM_EL, data)
        }

        const hijacking = (key: string, target: HTMLElement) => {
            const original = context.Object.getOwnPropertyDescriptor(target, key)
            context.Object.defineProperty(target, key, {
                set: function (value: string | boolean) {
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

        new Map<HTMLElement, string>([
            [context.HTMLSelectElement.prototype, 'value'],
            [context.HTMLTextAreaElement.prototype, 'value'],
            [context.HTMLOptionElement.prototype, 'selected']
        ]).forEach(hijacking.bind(this))

        new Map<string, HTMLElement>([
            ['value', context.HTMLInputElement.prototype],
            ['checked', context.HTMLInputElement.prototype]
        ]).forEach((target, key) => hijacking(key, target))
    }
}
