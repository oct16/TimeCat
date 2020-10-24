import { filteringScriptTag, isCommentNode, isElementNode, isHideComment, isTextNode } from '../src/tools/dom'

describe('Test of dom', () => {
    it('isCommentNode isElementNode isHideComment isExistingNode', () => {
        expect(isCommentNode({ nodeType: Node.COMMENT_NODE } as Node)).toBeTruthy()
        expect(isElementNode({ nodeType: Node.ELEMENT_NODE } as Node)).toBeTruthy()
        expect(isTextNode({ nodeType: Node.TEXT_NODE } as Node)).toBeTruthy()
        expect(isHideComment({ nodeType: Node.COMMENT_NODE, textContent: 'hidden' } as Node)).toBeTruthy()
    })
    it('filteringScriptTag', () => {
        const tag = '<script></script>'
        expect(filteringScriptTag(tag)).toEqual('<script><\\/script>')
    })
})
