import { createNode, setAttribute } from '@timecat/virtual-dom'
import { nodeStore } from '@timecat/utils'

describe('deserialize', () => {
    test('createNode', () => {
        const vNode = {
            id: 1,
            type: 1,
            attrs: {},
            tag: 'html',
            extra: {},
            children: []
        }
        const actual = createNode(vNode)
        expect(nodeStore.getNode(1)).toStrictEqual(actual)
    })
})
