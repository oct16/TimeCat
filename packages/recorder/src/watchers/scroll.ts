/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ScrollRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class ScrollWatcher extends Watcher<ScrollRecord> {
    private getCompatibleTarget(target: Document) {
        return (target.scrollingElement as HTMLElement) || target.documentElement
    }

    private scrollTop(target: HTMLElement) {
        return target.scrollTop
    }

    private scrollLeft(target: HTMLElement) {
        return target.scrollLeft
    }

    protected init() {
        const { scrollingElement } = this.context.document
        this.emitData(...this.wrapData(scrollingElement || document, true))
        this.registerEvent({
            context: this.context,
            eventTypes: ['scroll'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { leading: true, trailing: true },
            waitTime: 300
        })
    }

    private wrapData(target: Element | Document, isAuto = false): [RecordType.SCROLL, ScrollRecord['data']] {
        const element =
            target instanceof this.context.HTMLElement ? target : this.getCompatibleTarget(target as Document)

        const data = {
            id: this.getNodeId(element) || null, // if null, target is document
            top: this.scrollTop(element),
            left: this.scrollLeft(element)
        } as ScrollRecord['data']

        if (isAuto) {
            data.behavior = 'auto'
        }

        return [RecordType.SCROLL, data]
    }

    private handleFn(e: Event) {
        const { type, target } = e
        if (type === 'scroll') {
            this.emitData(...this.wrapData(target as Element | Document))
        }
    }
}
