/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { emptyTemplate, loadingScriptContent } from './tpl'
import {
    base64ToFloat32Array,
    encodeWAV,
    isDev,
    getRandomCode,
    getScript,
    logError,
    uint8ArrayToAscii
} from '@timecat/utils'
import { compressWithGzipByte } from 'brick.json/gzip/esm'
import { AudioData, AudioOptionsData, RecordData } from '@timecat/share'
import { download, transToReplayData, getGZipData, getRecordsFromDB, getRecordsFromStore } from './common'
import { recoverNative } from './polyfill/recover-native'
import { getPacks } from './transform'

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
const downloadAudioConfig = {
    extractAudioDataList: [] as {
        source: string[]
        fileName: string
    }[],
    opts: {} as AudioOptionsData
}

export async function exportReplay(exportOptions: ExportOptions) {
    recoveryMethods()
    const html = await createReplayDocument(exportOptions)
    const htmlStr = html.documentElement.outerHTML
    const exportName = exportOptions.exportName
    const fileName = `${exportName || EXPORT_NAME_LABEL}-${getRandomCode()}`
    downloadHTML(fileName, htmlStr)
    downloadAudios()
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

function downloadAudios() {
    if (window.G_REPLAY_DATA) {
        const replayData = window.G_REPLAY_DATA
        const audioSrc = replayData?.audio?.src
        if (audioSrc) {
            download(audioSrc, audioSrc)
            return
        }
    }

    downloadAudioConfig.extractAudioDataList.forEach(extractedData => {
        const floatArray = extractedData.source.map(data => base64ToFloat32Array(data))
        const audioBlob = encodeWAV(floatArray, downloadAudioConfig.opts)
        download(audioBlob, extractedData.fileName)
    })

    downloadAudioConfig.extractAudioDataList.length = 0
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
    const replayDataList = packs.map(transToReplayData)
    return replayDataList.forEach(replayData => {
        if (exportOptions && exportOptions.audioExternal) {
            replayData.audio = extractAudio(replayData.audio)
        }
        return replayData
    })
}

function extractAudio(audio: AudioData) {
    const source = audio.bufferStrList.slice()
    if (!source.length) {
        return audio
    }

    const fileName = `${EXPORT_NAME_LABEL}-audio-${getRandomCode()}.wav`
    downloadAudioConfig.extractAudioDataList.push({
        source,
        fileName
    })
    downloadAudioConfig.opts = audio.opts
    audio.src = fileName
    audio.bufferStrList.length = 0
    return audio
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
    extract(packs, exportOptions)

    const zipArray = compressWithGzipByte(records)

    const outputStr = uint8ArrayToAscii(zipArray)

    const replayData = `var G_REPLAY_STR_RECORDS =  '${outputStr}'`

    injectScripts(html, [{ src: replayData }])
}
