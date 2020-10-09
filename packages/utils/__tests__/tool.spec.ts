import { debounce, throttle } from '@timecat/utils'

describe('Test of tool', () => {
    jest.useFakeTimers()

    describe('test throttle', () => {
        it('should return undefined and none fun called when both trailing and leading are false', () => {
            const fn = jest.fn()

            const throttleFn = throttle(fn, 500)
            const result = [throttleFn('a'), throttleFn('b'), throttleFn('c')]
            expect(result).toStrictEqual([undefined, undefined, undefined])
            expect(fn).toBeCalledTimes(0)
        })

        it('subsequent calls should return the result of the first call', () => {
            const throttleFn = throttle((val: string) => val, 500, { trailing: true })
            const result = [throttleFn('a'), throttleFn('b'), throttleFn('c')]
            expect(result).toStrictEqual(['a', 'a', 'a'])
        })
    })

    describe('debounce', () => {
        let fn: () => void
        beforeEach(() => {
            fn = jest.fn()
        })

        it('should be called one time after the delay time', () => {
            const debounceFn = debounce(fn, 50)

            debounceFn()
            debounceFn()
            jest.advanceTimersByTime(40)
            expect(fn).toBeCalledTimes(0)

            jest.advanceTimersByTime(10)
            expect(fn).toBeCalledTimes(1)
        })

        it('should not immediately call `func` even `wait` is `0`', () => {
            const debounceFn = debounce(fn, 0)

            debounceFn()
            expect(fn).toBeCalledTimes(0)
            jest.advanceTimersByTime(1)
            expect(fn).toBeCalledTimes(1)
        })

        it('should immediately call `func` if isImmediate param is true', () => {
            const debounceFn = debounce(fn, 50, { isImmediate: true })

            debounceFn()
            expect(fn).toBeCalledTimes(1)
        })
        it('subsequent calls should return the result of the last call', () => {
            let a
            const debounceFn = debounce((val: string) => {
                a = val
            }, 50)
            debounceFn('a')
            debounceFn('b')
            debounceFn('c')
            jest.advanceTimersByTime(50)
            expect(a).toBe('c')
        })
    })
})
