import { TPL, pacmanCss } from './tpl'
import { getDBOperator } from '../store/idb'
import { isDev, transRecordsToPacks, download, getRandomCode, isVNode } from './common'
import pako from 'pako'
import {
    VNode,
    VSNode,
    AudioData,
    AudioOptionsData,
    RecordType,
    ReplayPack,
    RecordData,
    DOMRecord,
    DBRecordData
} from '@timecat/share'
import { base64ToFloat32Array, encodeWAV } from './transform'
import { getScript } from './dom'
import { recoverNative } from '../polyfill/recover-native'
import { nodeStore } from '../store/node'

type ScriptItem = { name?: string; src: string }
type ExportOptions = { scripts?: ScriptItem[]; autoplay?: boolean; audioExternal?: boolean; dataExternal?: boolean }

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
    await addNoneFrame()
    const parser = new DOMParser()
    const html = parser.parseFromString(TPL, 'text/html')
    await injectLoading(html)
    await injectData(html, exportOptions)
    await initOptions(html, exportOptions)
    downloadFiles(html)
}

function recoveryMethods() {
    const methods = [
        // 'HTMLElement.prototype.insertBefore',
        // 'HTMLElement.prototype.append',
        'HTMLElement.prototype.appendChild'
    ]

    methods.forEach(recoverNative.recoverMethod.bind(recoverNative))
}

async function addNoneFrame() {
    const DBOperator = await getDBOperator

    const count = await DBOperator.count()
    const last = await DBOperator.last()

    if (count && last.type !== RecordType.TERMINATE) {
        const lastTime = last.time
        DBOperator.add({
            type: RecordType.TERMINATE,
            data: null,
            relatedId: window.G_RECORD_RELATED_ID,
            time: lastTime + 1
        })
    }
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

export async function getRecordsFromDB() {
    const DBOperator = await getDBOperator
    const records: DBRecordData[] | null = await DBOperator.readAllRecords()
    if (records && records.length) {
        return records
    }
    return null
}

export function extract(replayPacks: ReplayPack[], exportOptions?: ExportOptions) {
    return replayPacks.map(replayPack => {
        replayPack.body.forEach(replayData => {
            if (exportOptions && exportOptions.audioExternal) {
                replayData.audio = extractAudio(replayData.audio)
            }
            return replayData
        })
        return replayPack
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
    const loadingScriptContent = `const loadingNode = document.createElement('div')
    loadingNode.className = 'pacman-box';
    loadingNode.innerHTML = '<style>${pacmanCss}<\/style><div class="pacman"><div><\/div><div><\/div><div><\/div><div><\/div><div><\/div><\/div>'
    loadingNode.setAttribute('style', 'text-align: center;vertical-align: middle;line-height: 100vh;')
    document.body.insertBefore(loadingNode, document.body.firstChild);window.addEventListener('DOMContentLoaded', () => loadingNode.parentNode.removeChild(loadingNode))`
    injectScripts(html, [{ src: loadingScriptContent }])
}

async function injectData(html: Document, exportOptions: ExportOptions) {
    const records = await getRecordsFromDB()

    if (!records) {
        return
    }

    extract(transRecordsToPacks(records), exportOptions)
    await makeCssInline(records) // some link cross origin

    const jsonStrData = JSON.stringify(records)

    const zipArray = pako.gzip(jsonStrData)
    let outputStr = ''

    for (let i = 0; i < zipArray.length; i++) {
        let num = zipArray[i]

        if (~[13, 34, 39, 44, 60, 62, 92, 96, 10, 0].indexOf(num)) {
            num += 300
        }

        outputStr += String.fromCharCode(num)
    }

    const replayData = `var G_REPLAY_STR_RECORDS =  '${outputStr}'`

    injectScripts(html, [{ src: replayData }])
}

async function makeCssInline(records: RecordData[]) {
    const tasks: VNode[] = []
    const extractLinkList: VNode[] = []
    const [base] = document.getElementsByTagName('base')

    records.forEach(record => {
        const { type, data } = record
        if (type === RecordType.SNAPSHOT) {
            tasks.push((data as { vNode: VNode }).vNode)
            let node: VNode
            while ((node = tasks.shift()!)) {
                if (isVNode(node)) {
                    extractLink(node, extractLinkList)
                    tasks.push(...(node.children as VNode[]))
                }
            }
        } else if (type === RecordType.DOM) {
            const { addedNodes } = (record as DOMRecord).data
            if (addedNodes) {
                for (let j = 0; j < addedNodes.length; j++) {
                    const node = addedNodes[j].node
                    if (isVNode(node as VNode)) {
                        extractLink(node as VNode, extractLinkList)
                    }
                }
            }
        }
    })

    for (const node of extractLinkList) {
        const { attrs } = node
        const href = attrs.href

        try {
            // try to extract css
            const cssURL = new URL(href, base?.href || location.href).href
            const cssValue = await fetch(cssURL).then(res => res.text())
            const textNode = {
                id: nodeStore.createNodeId(),
                type: Node.TEXT_NODE,
                value: cssValue
            } as VSNode

            delete attrs.href
            Object.keys(attrs).forEach(key => {
                delete attrs[key]
            })

            node.tag = 'style'
            node.attrs.type = 'text/css'
            node.attrs['css-url'] = cssURL
            node.children.push(textNode)
        } catch (error) {
            // maybe cross
        }
    }
}

function extractLink(node: VNode, extractLinkList: VNode[]) {
    const { tag, attrs } = node
    if (tag === 'link' && attrs.href && attrs.href.endsWith('.css')) {
        extractLinkList.push(node)
    }
}
