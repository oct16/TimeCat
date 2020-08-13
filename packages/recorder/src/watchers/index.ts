import { DOMWatcher } from './dom'
import { FormElementWatcher } from './form-element'
import { LocationWatcher } from './location'
import { MouseWatcher } from './mouse'
import { ScrollWatcher } from './scroll'
import { WindowWatcher } from './window'
import { CanvasWatcher } from './canvas'
import { TerminateWatcher } from './terminate'

export const watchers = {
    DOMWatcher,
    FormElementWatcher,
    LocationWatcher,
    MouseWatcher,
    ScrollWatcher,
    WindowWatcher,
    CanvasWatcher,
    TerminateWatcher
}
