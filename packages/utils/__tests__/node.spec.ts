import { nodeStore } from '@timecat/utils'

describe('Test of node store', () => {
    const testNode = document.createElement('div')
    it('test addNode and getNode function', () => {
        nodeStore.addNode(testNode, 1)
        expect(nodeStore.getNode(1)).toEqual(testNode)
        expect(nodeStore.getNodeId(testNode)).toBe(1)
    })

    it('test updateNode and getNode function', () => {
        const spanNode = document.createTextNode('span')

        nodeStore.updateNode(1, spanNode)
        expect(nodeStore.getNode(1)).toEqual(spanNode)
        expect(nodeStore.getNodeId(spanNode)).toBe(1)
    })

    it('test removeNode and getNode function', () => {
        nodeStore.removeNode(1)
        expect(nodeStore.getNode(1)).toBeNull()
    })

    it('test reset and getNode function', () => {
        nodeStore.addNode(testNode, 1)
        nodeStore.reset()
        expect(nodeStore.getNode(1)).toBeNull()
    })
})
