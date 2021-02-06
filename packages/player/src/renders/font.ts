import { FontRecordData } from '@timecat/share'
import { PlayerComponent } from '../components/player'

export function renderFont(this: PlayerComponent, data: FontRecordData) {
    const { family, source } = data
    const buffer = new Uint8Array(source.length)
    for (let i = 0; i < source.length; i++) {
        const code = source.charCodeAt(i)
        buffer[i] = code
    }
    const font = new window.FontFace(family, buffer)
    this.c.sandBoxDoc.fonts.add(font)
    document.fonts.add(font)
}
