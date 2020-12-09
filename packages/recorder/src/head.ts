import { ReplayHead } from '@timecat/share'
import { getRandomCode, getTime } from '@timecat/utils'
import pkg from 'pkg'
import Fingerprint2 from 'fingerprintjs2'

export async function getHeadData() {
    const fp = await Fingerprint2.getPromise({}).then(components => {
        const values = components.map(component => {
            return component.value
        })
        const murmur = Fingerprint2.x64hash128(values.join(''), 31)
        return murmur
    })

    return {
        href: location.href,
        title: document.title,
        relatedId: getRandomCode(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        beginTime: getTime(),
        version: pkg.version,
        fp
    } as ReplayHead
}
