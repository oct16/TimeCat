import { ReplayHead, RecordType, HeadRecord } from '@timecat/share'
import { getRadix64TimeStr, getRandomCode, getTime } from '@timecat/utils'

export function getHeadData() {
    return {
        type: RecordType.HEAD,
        data: <ReplayHead>{
            href: location.href,
            sessionId: getRandomCode(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            beginTime: getTime().toString()
        },
        time: getRadix64TimeStr()
    } as HeadRecord
}
