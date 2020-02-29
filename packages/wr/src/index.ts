import { screenshot } from '@WebReplay/screenshot'

const snapshotDom = screenshot.DOMSnapshot()
document.body = snapshotDom.body
