/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CanvasRecord, RecordType } from '@timecat/share'
import { Watcher } from '../../watcher'
import { isCanvasBlank } from './utils'

export class CanvasSnapshotWatcher extends Watcher<CanvasRecord> {
    protected init() {
        const canvasElements = document.getElementsByTagName('canvas')
        Array.from(canvasElements).forEach(canvas => {
            this.snapshotCanvas(canvas)
        })
    }

    public snapshotCanvas(canvas: HTMLCanvasElement) {
        if (isCanvasBlank(canvas)) {
            return
        }

        const dataURL = canvas.toDataURL()
        this.emitData(RecordType.CANVAS_SNAPSHOT, {
            id: this.getNodeId(canvas),
            src: dataURL
        })
    }
}
