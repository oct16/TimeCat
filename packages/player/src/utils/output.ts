/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { emptyTemplate, loadingScriptContent } from './tpl'
import { isDev, getRandomCode, getScript, logError, uint8ArrayToAscii, bufferArrayToBase64 } from '@timecat/utils'
import { compressWithGzipByte } from 'brick.json/gzip/esm'
import { AudioRecord, AudioStrList, RecordData, RecordType } from '@timecat/share'
import { download, getGZipData, getRecordsFromDB, getRecordsFromStore } from './common'
import { recoverNative } from './polyfill/recover-native'
import { convertAudioBuffer, getPacks } from './transform'

type ScriptItem = { name?: string; src: string }
type ExportOptions = Partial<{
    exportName: string
    scripts: ScriptItem[]
    autoplay: boolean
    audioExternal: boolean
    dataExternal: boolean
    records: RecordData[]
}>

const EXPORT_NAME_LABEL = 'TimeCat'

export async function exportReplay(exportOptions: ExportOptions) {
    recoveryMethods()
    const html = await createReplayDocument(exportOptions)
    const htmlStr = html.documentElement.outerHTML
    const exportName = exportOptions.exportName
    const fileName = `${exportName || EXPORT_NAME_LABEL}-${getRandomCode()}`
    downloadHTML(fileName, htmlStr)
    // downloadAudios()
}

export async function createReplayDocument(exportOptions: ExportOptions): Promise<Document> {
    // await addNoneFrame()
    const parser = new DOMParser()
    const html = parser.parseFromString(emptyTemplate, 'text/html')
    await injectLoading(html)
    await injectData(html, exportOptions)
    await initOptions(html, exportOptions)
    return html
}

function recoveryMethods() {
    const methods = [
        // 'HTMLElement.prototype.insertBefore',
        // 'HTMLElement.prototype.append',
        'HTMLElement.prototype.appendChild'
    ]

    methods.forEach(recoverNative.recoverMethod.bind(recoverNative))
}

function downloadHTML(name: string, content: string) {
    const blob = new Blob([content], { type: 'text/html' })
    download(blob, `${name}.html`)
}

async function initOptions(html: Document, exportOptions: ExportOptions) {
    const { scripts, autoplay } = exportOptions
    const options = { autoplay }
    const scriptList = scripts || ([] as ScriptItem[])

    if (!scriptList.some(item => item.name === 'timecat-init')) {
        scriptList.push({
            name: 'timecat-init',
            src: `new TimeCat.Player(${JSON.stringify(options)})`
        })
    }

    await injectScripts(html, scriptList)
}

async function injectScripts(html: Document, scripts: ScriptItem[]) {
    if (scripts) {
        for (const scriptItem of scripts) {
            const { src, name } = scriptItem
            let scriptContent = src
            const script = document.createElement('script')
            if (name) {
                script.id = name
            }
            const isUrlReg = /^((chrome-extension|https?):)?\/\/.+/
            // is a link or script text
            if (isUrlReg.test(src)) {
                if (isDev) {
                    script.src = src
                } else {
                    scriptContent = await getScript(src)
                }
            }
            script.text = scriptContent
            html.body.appendChild(script)
        }
    }
}

export function extract(packs: RecordData[][], exportOptions?: ExportOptions) {
    return packs.map(extractAudio)
}

function extractAudio(records: RecordData[]) {
    const audioPCMRecords: AudioRecord<AudioStrList>[] = []
    const extractedRecords: RecordData[] = []

    records.forEach(record => {
        if (record.type === RecordType.AUDIO) {
            const recordData = record.data as AudioStrList
            if (recordData.type === 'pcm') {
                audioPCMRecords.push(record as AudioRecord<AudioStrList>)
                return
            }
        }
        extractedRecords.push(record)
    })

    if (audioPCMRecords.length) {
        const dataView = convertAudioBuffer(audioPCMRecords)
        const buffer = dataView.buffer
        const wavBase64Str = bufferArrayToBase64(buffer)

        const insertIndex = extractedRecords.length - 1

        const prevRecord = extractedRecords[insertIndex]

        const data: AudioStrList = {
            type: 'wav',
            encode: 'base64',
            data: [wavBase64Str]
        }
        const wavRecord = {
            ...prevRecord,
            time: audioPCMRecords.slice(-1)[0].time,
            type: RecordType.AUDIO,
            data
        } as AudioRecord<AudioStrList>

        extractedRecords.splice(insertIndex, 0, wavRecord)
    }

    return extractedRecords
}

async function injectLoading(html: Document) {
    injectScripts(html, [{ src: loadingScriptContent }])
}

async function injectData(html: Document, exportOptions: ExportOptions) {
    const records = exportOptions.records || getGZipData() || getRecordsFromStore() || (await getRecordsFromDB())

    if (!records) {
        return logError('Records not found')
    }
    const packs = getPacks(records)

    const extractedRecords = extract(packs, exportOptions).flat(1)

    const zipArray = compressWithGzipByte(extractedRecords)

    const outputStr = uint8ArrayToAscii(zipArray)

    const replayData = `var G_REPLAY_STR_RECORDS =  '${outputStr}'`

    injectScripts(html, [{ src: replayData }])
}
