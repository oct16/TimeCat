import { setAttribute } from '@timecat/virtual-dom'
import { completeCssHref } from '@timecat/utils'

describe('dom', () => {
    describe('setAttribute', () => {
        const node = window.document.createElement('a')

        test('should return undefined when nodeType === Text', () => {
            const node = window.document.createTextNode('data')
            expect(setAttribute((node as unknown) as HTMLElement, 'id', 'testNode')).toBeUndefined()
        })

        test('test attr is style and valueType is string', () => {
            setAttribute(node, 'style', 'color:red')
            expect(node.style.cssText).toEqual('color: red;')
        })

        test('test attr is style and valueType is object', () => {
            setAttribute(node, 'style', { color: 'red' })
            expect(node.style.color).toEqual('red')
        })

        test('test attr is src and valueType include js', () => {
            setAttribute(node, 'src', 'a.js')
            expect(setAttribute(node, 'src', 'a.js')).toBeUndefined()
        })
    })
})
