import { DOMWatcher } from './dom'
import { FormElementWatcher } from './form-element'
import { LocationWatcher } from './location'
import { MouseWatcher } from './mouse'
import { ScrollWatcher } from './scroll'
import { WindowWatcher } from './window'
import { CanvasWatcher } from './canvas'
import { TerminateWatcher } from './terminate'
import { FontWatcher } from './font'

export const watchers = {
    FontWatcher,
    DOMWatcher,
    FormElementWatcher,
    LocationWatcher,
    MouseWatcher,
    ScrollWatcher,
    WindowWatcher,
    CanvasWatcher,
    TerminateWatcher
}
