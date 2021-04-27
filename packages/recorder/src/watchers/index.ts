/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DOMWatcher } from './dom'
import { FormElementWatcher } from './form-element'
import { LocationWatcher } from './location'
import { MouseWatcher } from './mouse'
import { ScrollWatcher } from './scroll'
import { WindowWatcher } from './window'
import { CanvasSnapshotWatcher, Canvas2DWatcher, CanvasWebGLWatcher } from './canvas'
import { TerminateWatcher } from './terminate'
import { FontWatcher } from './font'

export const playerWatchers = {
    FormElementWatcher,
    MouseWatcher,
    ScrollWatcher
}

export const baseWatchers = {
    DOMWatcher,
    ...playerWatchers
}

export const watchers = {
    LocationWatcher,
    ...baseWatchers,
    WindowWatcher,
    CanvasSnapshotWatcher,
    Canvas2DWatcher,
    CanvasWebGLWatcher,
    FontWatcher,
    TerminateWatcher
}
