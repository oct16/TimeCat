import { isExistingNode, getPos } from '@WebReplay/utils'

export class PosCalculator {
    nodesRelateMap: Map<Node, number | { prev?: Node | null; next?: Node | null }> = new Map()
    NodesMap: Map<Node, MutationRecord>
    constructor(map: Map<Node, MutationRecord>) {
        this.NodesMap = map
        ;[...this.NodesMap.entries()].forEach(entries => {
            const [node, record] = entries
            const { target: previousSibling, nextSibling } = record

            //  There is only one childNodes
            if (!previousSibling && !nextSibling) {
                this.nodesRelateMap.set(node, 0)
                this.fillNodePos()
                return
            }

            if (previousSibling || nextSibling) {
                if (previousSibling && isExistingNode(previousSibling)) {
                    this.nodesRelateMap.set(node, getPos(previousSibling) + 1)
                    this.fillNodePos()
                }

                if (nextSibling && isExistingNode(nextSibling)) {
                    this.nodesRelateMap.set(node, getPos(nextSibling) - 1)
                    this.fillNodePos()
                }
            } else {
                this.nodesRelateMap.set(node, {
                    prev: previousSibling,
                    next: nextSibling
                })
            }
        })
    }

    fillNodePos() {
        ;[...this.nodesRelateMap.entries()].forEach(entries => {
            const [node, pos] = entries
            if (typeof pos !== 'number') {
                const { prev, next } = pos as { prev?: Node | null; next?: Node | null }
                if (prev && this.nodesRelateMap.has(prev)) {
                    this.nodesRelateMap.set(prev, (this.nodesRelateMap.get(prev) as number) + 1)
                } else if (next && this.nodesRelateMap.has(next)) {
                    this.nodesRelateMap.set(next, (this.nodesRelateMap.get(next) as number) - 1)
                }
            }
        })
    }
}
