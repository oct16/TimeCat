import Fingerprint2 from 'fingerprintjs2'
import { getRandomCode, getTime } from '@timecat/utils'
import { getHeadData } from '../src/head'
import pkg from 'pkg'

describe('Test of head', () => {
    it('getHeadData ', async () => {
        const fp = await Fingerprint2.getPromise({}).then(components => {
            const values = components.map(component => {
                return component.value
            })
            return Fingerprint2.x64hash128(values.join(''), 31)
        })

        Object.defineProperty(Math, 'random', {
            value: () => 0.25566305092035857
        })

        Object.defineProperty(performance, 'timing', {
            value: {
                navigationStart: 111.2
            }
        })
        performance.now = () => 111
        const expectedHead = {
            href: location.href,
            relatedId: getRandomCode(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            beginTime: getTime(),
            version: pkg.version,
            fp
        }

        const actualHead = await getHeadData()
        expect(actualHead).toStrictEqual(expectedHead)
    })
})
