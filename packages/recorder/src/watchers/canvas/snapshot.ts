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

export class CanvasSnapshotWatcher extends Watcher<CanvasRecord> {
    protected init() {
        const canvasElements = document.getElementsByTagName('canvas')
        this.snapshotCanvas(Array.from(canvasElements))
    }

    public snapshotCanvas(canvasList: Array<HTMLCanvasElement>) {
        canvasList.forEach(canvas => {
            const dataURL = canvas.toDataURL()
            this.emitData(RecordType.CANVAS, {
                id: this.getNodeId(canvas),
                src: dataURL
            })
        })
    }
}
