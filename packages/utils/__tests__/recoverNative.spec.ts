import { recoverNative } from '@timecat/utils'

describe('Test of recover-native', () => {
    it('Test an nonexistent function', () => {
        const testFun = jest.fn()

        const bodyEle = document.getElementsByTagName('body')!
        HTMLElement.prototype.click = testFun
        bodyEle[0].click()
        expect(testFun).toBeCalledTimes(1)
        recoverNative.recoverMethod('HTMLElement.prototype.click')

        bodyEle[0].click()
        expect(testFun).toBeCalledTimes(1)
    })
})
