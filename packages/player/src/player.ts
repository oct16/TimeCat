import { VNode, diffNode } from '@WebReplay/virtual-dom'

export function convertBackNodeByVNode(vnode: VNode) {
    return diffNode(vnode, null)
}
