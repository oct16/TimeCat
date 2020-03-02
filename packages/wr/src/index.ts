import { screenshot } from '@WebReplay/screenshot'
import { virtualDOM } from '@WebReplay/virtual-dom'
// import { convertBackNodeByVNode } from '@WebReplay/player'

const html = screenshot.DOMSnapshot()

const VHTML = virtualDOM.convertHTML(html)

console.log(VHTML)

