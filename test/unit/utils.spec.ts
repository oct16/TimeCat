import { completionCssHref, completionAttrHref } from 'packages/utils/src/tools/dom'

test('expect return full href', () => {
    const origin = jest.fn()
    const protocol = jest.fn()
    expect(completionAttrHref('//cat.dog.com')).toBe('http://cat.dog.com')
})
