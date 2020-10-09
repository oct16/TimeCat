import { radix64 } from '@timecat/utils'

describe('Test of radix64', () => {
    const ENCODE_TYPE = {
        BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        BASE_URL: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    }

    describe('Test of atob', () => {
        it('test return when arguments str length === 1', () => {
            const testParam = 'T'
            const expected = ENCODE_TYPE['BASE_URL'].indexOf(testParam) + 1
            const actual = radix64.atob(testParam)
            expect(actual).toBe(expected)
        })
        it('test return when arguments str === test', () => {
            const testParam = 'test'
            const expected = 12188526
            const actual = radix64.atob(testParam)
            expect(actual).toBe(expected)
        })
        it('test return when arguments str === AB', () => {
            const testParam = 'AB'
            const expected = 66
            const actual = radix64.atob(testParam)
            expect(actual).toBe(expected)
        })
    })

    describe('Test of btoa', () => {
        it('test return when arguments num < length of ENCODE_TYPE[key]', () => {
            const testParam = 66
            const expected = 'AB'
            const actual = radix64.btoa(testParam)
            expect(actual).toBe(expected)
        })
        it('test return when arguments num === 11922221', () => {
            const testParam = 12188526
            const expected = 'test'
            const actual = radix64.btoa(testParam)
            expect(actual).toBe(expected)
        })
    })

    it('Test of btoa after atob ', () => {
        const testParam = 'atob'
        const num = radix64.atob(testParam)
        const asc = radix64.btoa(num)
        expect(asc).toBe(testParam)
    })
})
