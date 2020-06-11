import { TPL, pacmanCss } from './tpl'
import { DBPromise } from './store/idb'
import { filteringScriptTag } from './tools/dom'
import { isDev, classifyRecords, download, getRandomCode } from './tools/common'
import pako from 'pako'
import { SnapshotData } from '@TimeCat/snapshot'
import { RecordData, AudioData, RecorderOptions } from '@TimeCat/record'
import { base64ToFloat32Array, encodeWAV } from './transform'

type ScriptItem = { name?: string; src: string }
type ExportOptions = { scripts?: ScriptItem[]; autoplay?: boolean; audioExternal?: boolean; dataExternal?: boolean }

const EXPORT_NAME_LABEL = 'TimeCat'
const downloadAudioConfig = {
    extractAudioDataList: [] as {
        source: string[]
        fileName: string
    }[],
    opts: {} as RecorderOptions
}

export async function exportReplay(exportOptions: ExportOptions) {
    const parser = new DOMParser()
    const html = parser.parseFromString(TPL, 'text/html')
    await injectData(html, exportOptions)
    await initOptions(html, exportOptions)
    downloadFiles(html)
}

function downloadHTML(content: string) {
    const blob = new Blob([content], { type: 'text/html' })
    download(blob, `${EXPORT_NAME_LABEL}-${getRandomCode()}.html`)
}

function downloadFiles(html: Document) {
    downloadHTML(html.documentElement.outerHTML)
    downloadAudios()
}

function downloadAudios() {
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
    scriptList.push({
        name: 'time-cat-init',
        src: `timecat.replay(${JSON.stringify(options)})`
    })

    await injectScripts(html, scriptList)
}

async function injectScripts(html: Document, scripts?: ScriptItem[]) {
    if (scripts) {
        for (let scriptItem of scripts) {
            const { src, name } = scriptItem
            let scriptContent = src
            const script = document.createElement('script')
            if (name) {
                script.id = name
            }
            const isUrlReg = /^(chrome-extension|https?):\/\/.+/
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

async function getScript(src: string) {
    return await fetch(src)
        .then(res => res.text())
        .then(filteringScriptTag)
}

async function getDataFromDB(exportOptions?: ExportOptions) {
    const indexedDB = await DBPromise
    const data = await indexedDB.readAllRecords()
    const classified = classifyRecords(data)
    return extract(classified, exportOptions)
}

function extract(
    replayDataList: { snapshot: SnapshotData; records: RecordData[]; audio: AudioData }[],
    exportOptions?: ExportOptions
) {
    return replayDataList.map(replayData => {
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

async function injectData(html: Document, exportOptions: ExportOptions) {
    const data = window.__ReplayDataList__ || (await getDataFromDB(exportOptions))
    const jsonStrData = JSON.stringify(data)
    const zipArray = pako.gzip(jsonStrData)
    let outputStr: string = ''

    for (let i = 0; i < zipArray.length; i++) {
        let num = zipArray[i]

        if (~[13, 34, 39, 44, 60, 62, 92, 96, 10, 0].indexOf(num)) {
            num += 300
        }

        outputStr += String.fromCharCode(num)
    }

    const scriptContent = `var __ReplayStrData__ =  '${outputStr}'`

    const loadingScriptContent = `const loadingNode = document.createElement('div')
    loadingNode.className = 'pacman-box';
    loadingNode.innerHTML = '<style>${pacmanCss}<\/style><div class="pacman"><div><\/div><div><\/div><div><\/div><div><\/div><div><\/div><\/div>'
    loadingNode.setAttribute('style', 'text-align: center;vertical-align: middle;line-height: 100vh;')
    document.body.insertBefore(loadingNode, document.body.firstChild);window.onload = () => loadingNode.parentNode.removeChild(loadingNode)`
    injectScripts(html, [{ src: loadingScriptContent }])
    injectScripts(html, [{ src: scriptContent }])
}
