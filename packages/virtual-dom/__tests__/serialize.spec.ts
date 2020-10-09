import { createElement, createFlatVNode } from '@timecat/virtual-dom'

describe('Test of serialize', () => {
    test('createFlatVNode', () => {})

    test('createElement', () => {
        const expected = {
            id: 1,
            type: 1,
            attrs: {},
            tag: 'html',
            extra: {},
            children: [
                {
                    id: 2,
                    type: 1,
                    attrs: {},
                    tag: 'head',
                    children: [],
                    extra: {}
                },
                {
                    id: 3,
                    type: 1,
                    attrs: {},
                    tag: 'body',
                    children: [
                        {
                            id: 4,
                            type: 1,
                            attrs: {
                                style: 'display: none; visibility: hidden;'
                            },
                            tag: 'iframe',
                            extra: {},
                            children: []
                        }
                    ],
                    extra: {}
                }
            ]
        }
        const vNode = createElement(window.document.documentElement)
        expect(vNode).toEqual(expected)
    })

    test('createFlatVNode', () => {
        const expected = { id: 5, type: 1, attrs: {}, tag: 'html', children: [], extra: {} }
        const vNode = createFlatVNode(window.document.documentElement)
        expect(vNode).toEqual(expected)
    })
})
