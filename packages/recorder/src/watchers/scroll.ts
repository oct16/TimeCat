/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WatcherOptions, ScrollRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class ScrollWatcher extends Watcher<ScrollRecord> {
    constructor(options: WatcherOptions<ScrollRecord>) {
        super(options)
        this.init()
    }

    getCompatibleTarget = (target: Document) => (target.scrollingElement as HTMLElement) || target.documentElement
    scrollTop = (target: HTMLElement) => target.scrollTop
    scrollLeft = (target: HTMLElement) => target.scrollLeft

    init() {
        const { scrollingElement } = this.context.document
        this.emitData(...this.wrapData(scrollingElement || document))
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

    wrapData(target: Element | Document): [RecordType.SCROLL, ScrollRecord['data']] {
        const element =
            target instanceof this.context.HTMLElement ? target : this.getCompatibleTarget(target as Document)

        return [
            RecordType.SCROLL,
            {
                id: this.getNodeId(element) || null, // if null, target is document
                top: this.scrollTop(element),
                left: this.scrollLeft(element)
            }
        ]
    }

    handleFn(e: Event) {
        const { type, target } = e
        if (type === 'scroll') {
            this.emitData(...this.wrapData(target as Element | Document))
        }
    }
}
