import { ReplayHead } from '@timecat/share'
import { getRandomCode, getTime } from '@timecat/utils'
import pkg from 'pkg'

export function getHeadData() {
    return {
        href: location.href,
        relatedId: getRandomCode(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        beginTime: getTime().toString(),
        version: pkg.version
    } as ReplayHead
}
