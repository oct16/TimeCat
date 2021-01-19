/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WindowRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class WindowWatcher extends Watcher<WindowRecord> {
    width() {
        return this.context.innerWidth
    }

    height() {
        return this.context.innerHeight
    }

    init() {
        this.emitData(...this.wrapData(this.context.document))
        this.registerEvent({
            context: this.context,
            eventTypes: ['resize'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { trailing: true },
            waitTime: 500
        })
    }

    handleFn(e: Event) {
        const { type, target } = e
        if (type === 'resize') {
            this.emitData(...this.wrapData(target as Element | Document))
        }
    }

    wrapData(target: Element | Document): [RecordType.WINDOW, WindowRecord['data']] {
        return [
            RecordType.WINDOW,
            {
                id: this.getNodeId(target) || null,
                width: this.width(),
                height: this.height()
            }
        ]
    }
}
