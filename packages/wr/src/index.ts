import { snapshot } from '@WebReplay/snapshot'
import { virtualDOM } from '@WebReplay/virtual-dom'
// import { convertBackNodeByVNode } from '@WebReplay/player'

const html = snapshot.DOMSnapshot()

const VHTML = virtualDOM.convertHTML(html)

console.log(VHTML)
