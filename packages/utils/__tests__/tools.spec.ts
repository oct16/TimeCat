import {
    debounce,
    delay,
    getDateTime,
    getRandomCode,
    getStrDiffPatches,
    getTime,
    isNumeric,
    logAdvice,
    logAsciiLogo,
    logError,
    logInfo,
    logWarn,
    removeGlobalVariables,
    revertStrByPatches,
    secondToTime,
    stateDebounce,
    throttle,
    toTimeStamp
} from '@timecat/utils'

describe('Utils Tools Testing', () => {
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()

    test('Log Info', () => {
        expect(typeof logError('') === 'string').toBeTruthy()
        expect(typeof logWarn('') === 'string').toBeTruthy()
        expect(typeof logAdvice('') === 'string').toBeTruthy()
        expect(logAsciiLogo()).toBeUndefined()
        expect(logInfo()).toBeUndefined()
    })

    test('Second To Time', () => {
        expect(secondToTime(0)).toBe('00:00')
        expect(secondToTime(100)).toBe('01:40')
        expect(secondToTime(3599)).toBe('59:59')
        expect(secondToTime(3600)).toBe('01:00:00')
    })

    // test('Get Date Time', () => {
    //     expect(getDateTime(1615218900000)).toBe('15:55:00')
    //     expect(getDateTime(1615247700000)).toBe('23:55:00')
    //     expect(getDateTime(1615248000000)).toBe('00:00:00')
    // })

    test('To Time Stamp', () => {
        expect(toTimeStamp('00:00:00')).toBe(0)
        expect(toTimeStamp('00:01:00')).toBe(60000)
        expect(toTimeStamp('01:00:00')).toBe(3600000)
    })

    test('Delay After 1s', () => {
        var callback = jest.fn()
        jest.useFakeTimers()

        expect(callback).not.toBeCalled()
        delay(1000)
            .then(callback)
            .then(() => {
                expect(callback).toBeCalled()
                expect(callback).toHaveBeenCalledTimes(1)
            })

        expect(setTimeout).toHaveBeenCalledTimes(1)
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
    })

    test('Get Str Diff Patches', () => {
        expect(getStrDiffPatches('abcd', 'abcd')).toEqual([])

        expect(getStrDiffPatches('abcd', 'bcde')).toEqual([
            { index: 0, type: 'rm', len: 1 },
            { index: 3, type: 'add', value: 'e' }
        ])
    })

    test('Revert Str By Patches', () => {
        const initialStr = 'make a world better place'
        const expectStr = 'hello world'
        const patches = getStrDiffPatches(initialStr, expectStr)
        expect(revertStrByPatches(initialStr, patches)).toEqual(expectStr)
    })

    test('isNumeric', () => {
        expect(isNumeric('0')).toBeTruthy()
        expect(isNumeric('01')).toBeTruthy()
        expect(isNumeric('666')).toBeTruthy()
        expect(isNumeric('NaN')).toBeFalsy()
        expect(isNumeric('abc')).toBeFalsy()
    })

    test('Remove Global Variables', () => {
        ;(global as any).G_RECORD_TEXT = 'text'
        ;(global as any).G_RECORD_OBJECT = {}
        ;(global as any).G_REPLAY_TEXT = 'text'
        ;(global as any).G_REPLAY_OBJECT = {}
        expect((global as any).G_RECORD_TEXT).toBe('text')
        expect((global as any).G_RECORD_OBJECT).toEqual({})
        expect((global as any).G_REPLAY_TEXT).toBe('text')
        expect((global as any).G_REPLAY_OBJECT).toEqual({})

        removeGlobalVariables()

        expect((global as any).G_RECORD_TEXT).toBeUndefined()
        expect((global as any).G_RECORD_OBJECT).toBeUndefined()
        expect((global as any).G_REPLAY_TEXT).toBeUndefined()
        expect((global as any).G_REPLAY_OBJECT).toBeUndefined()
    })

    test('State Debounce', () => {
        jest.useFakeTimers()
        let state: any = 'state0'
        let setState = (s: string) => {}
        stateDebounce<'state0' | 'state1'>(set => (setState = set), 1000, state)(s => (state = s))

        setState('state1')
        expect(state).toBe('state0')
        jest.runAllTimers()
        expect(state).toBe('state1')
    })

    test('Debounce', () => {
        jest.useFakeTimers()

        var test = jest.fn()
        var debounced = debounce(test, 1000)

        debounced()
        debounced()
        debounced()

        expect(test).toHaveBeenCalledTimes(0)

        jest.runAllTimers()

        expect(test).toHaveBeenCalledTimes(1)
    })

    test('Throttle', () => {
        jest.useFakeTimers()

        var test = jest.fn()
        var throttled = throttle(test, 1000)

        throttled()
        throttled()

        expect(test).toHaveBeenCalledTimes(1)
        jest.runAllTimers()
        expect(test).toHaveBeenCalledTimes(2)
    })

    test('Throttle, leading: false', () => {
        jest.useFakeTimers()

        var test = jest.fn()
        var throttled = throttle(test, 1000, { leading: false })

        throttled()
        throttled()

        expect(test).toHaveBeenCalledTimes(0)
        jest.runAllTimers()
        expect(test).toHaveBeenCalledTimes(1)
    })

    test('Throttle, leading: false', () => {
        jest.useFakeTimers()

        var test = jest.fn()
        var throttled = throttle(test, 1000, { leading: false, trailing: false })

        throttled()
        throttled()

        expect(test).toHaveBeenCalledTimes(0)
        jest.runAllTimers()
        expect(test).toHaveBeenCalledTimes(0)
    })
})
