/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 *
 * Reference and more info:
 * https://github.com/Microsoft/TypeScript/issues/30984
 * https://developer.mozilla.org/en-US/docs/Web/API/FontFace/FontFace
 *
 */
import { FontRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

export class FontWatcher extends Watcher<FontRecord> {
    protected init() {
        if (this.recordOptions.font) {
            this.interceptAddFont()
        }
    }

    private interceptAddFont() {
        const original = window.FontFace
        const self = this
        function FontFace(family: string, source: string | ArrayBuffer) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
            // https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
            function ab2str(buffer: ArrayBuffer) {
                return String.fromCharCode.apply(null, buffer)
            }

            const font = new original(family, source)
            self.emitData(RecordType.FONT, {
                family,
                source: typeof source === 'string' ? source : ab2str(source)
            })
            document.fonts.add(font)
        }

        window.FontFace = (FontFace as unknown) as FontFace

        this.uninstall(() => {
            window.FontFace = original
        })
    }
}
