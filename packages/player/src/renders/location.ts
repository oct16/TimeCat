import { LocationRecordData } from '@timecat/share'
import { nodeStore } from '@timecat/utils'

export async function renderLocation(data: LocationRecordData) {
    const { path, hash, href, contextNodeId } = data as LocationRecordData
    const contextNode = nodeStore.getNode(contextNodeId)

    if (contextNode) {
        const context = contextNode.ownerDocument!.defaultView!
        context.G_REPLAY_LOCATION = { ...context.G_REPLAY_LOCATION, ...{ path, hash, href } }
    }
}
