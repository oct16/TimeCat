/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VideoRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'

import { PlayerComponent } from '../components/player'

export function renderVideo(this: PlayerComponent, data: VideoRecordData) {
    const { id, blobUrl } = data

    if (!blobUrl) {
        return
    }

    const targetNode = nodeStore.getNode(id)
    const targetVideo = targetNode as HTMLVideoElement

    if (!targetVideo) {
        return
    }

    targetVideo.autoplay = true
    targetVideo.muted = true
    targetVideo.controls = false
    targetVideo.src = blobUrl
}
