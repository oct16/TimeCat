import { SnapshotData, WindowSnapshotData, DOMSnapshotData } from '@WebReplay/snapshot'
import { Container } from './container'

export function replay(data: SnapshotData[]) {
    const [{ width, height }, { vNode }] = data.splice(0, 2).map(_ => _.data) as [WindowSnapshotData, DOMSnapshotData]
    document.documentElement.innerHTML = ''
    new Container({
        vNode,
        width,
        height,
        data
    })
}
