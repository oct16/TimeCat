import { TPL } from './tpl'
import { DBPromise } from './store/idb'
import { filteringScriptTag } from './tools/dom'
import { isDev, classifyRecords } from './tools/common'
import pako from 'pako'

type ScriptItem = { name: string; src: string }
type Opts = { scripts?: ScriptItem[]; autoPlay?: boolean }

export async function exportReplay(opts: Opts = {}) {
    const parser = new DOMParser()
    const html = parser.parseFromString(TPL, 'text/html')
    await injectData(html)
    await initOptions(html, opts)
    createAndDownloadFile(`TimeCat-${Date.now()}`, html.documentElement.outerHTML)
}

function createAndDownloadFile(fileName: string, content: string) {
    var aTag = document.createElement('a')
    var blob = new Blob([content], { type: 'text/html' })
    aTag.download = fileName + '.html'
    aTag.href = URL.createObjectURL(blob)
    aTag.click()
    URL.revokeObjectURL(blob as any)
}

async function initOptions(html: Document, opts: Opts) {
    const { autoPlay, scripts } = opts

    const scriptList = scripts || ([] as ScriptItem[])
    if (autoPlay) {
        scriptList.push({
            name: 'time-cat-init',
            src: `timecat.replay()`
        })
    }
    await injectScripts(html, scriptList)
}

async function injectScripts(html: Document, scripts?: ScriptItem[]) {
    if (scripts) {
        for (let scriptItem of scripts) {
            const { src, name } = scriptItem
            let scriptContent = src
            const script = document.createElement('script')
            script.id = name
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

async function getDataFromDB() {
    const indexedDB = await DBPromise
    const data = await indexedDB.readAllRecords()
    return classifyRecords(data)
}

async function injectData(html: Document) {
    const dataScript = document.createElement('script')
    const data = window.__ReplayDataList__ || (await getDataFromDB())
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
    dataScript.innerHTML = scriptContent
    html.body.insertBefore(dataScript, html.body.firstChild)
}
