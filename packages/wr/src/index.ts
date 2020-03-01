import { screenshot } from '@WebReplay/screenshot'
import { convertBackNodeByVNode } from '@WebReplay/player'
import { virtualDOM } from '@WebReplay/virtual-dom'

const html = screenshot.DOMSnapshot()
// document.replaceChild(snapshot, document.documentElement)

const vNodeHTML = virtualDOM.convertHTML(html)
// document.body.innerHTML = `<pre>${JSON.stringify(vNodeHTML, null, 2)}</pre>`
document.replaceChild(convertBackNodeByVNode(vNodeHTML) as Element, document.documentElement)
