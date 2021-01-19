/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TerminateRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class TerminateWatcher extends Watcher<TerminateRecord> {
    init() {
        this.context.addEventListener('beforeunload', this.handleFn)

        this.uninstall(() => {
            this.context.removeEventListener('beforeunload', this.handleFn)
        })
    }

    handleFn() {
        // do some sync job
        // navigator.sendBeacon(url, data)
        // this.emitData(this.wrapData())
    }

    wrapData() {
        return [RecordType.TERMINATE, null]
    }
}
