/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
