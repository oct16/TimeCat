import TPL from '../../../tpls/tpl.html'
import { DBPromise as DB } from './store/idb'
import { filteringScriptTag } from './tool'
import { isDev } from './tool'
import pako from 'pako'

type ScriptItem = { name: string; src: string }
type Opts = { scripts?: ScriptItem[]; autoPlay?: boolean }
const parser = new DOMParser()
const html = parser.parseFromString(TPL, 'text/html')

export async function exportReplay(opts: Opts = {}) {
    await injectData()
    await initOptions(opts)
    createAndDownloadFile(`WebReplay-${Date.now()}`, html.documentElement.outerHTML)
}

function createAndDownloadFile(fileName: string, content: string) {
    var aTag = document.createElement('a')
    var blob = new Blob([content], { type: 'text/html' })
    aTag.download = fileName + '.html'
    aTag.href = URL.createObjectURL(blob)
    aTag.click()
    URL.revokeObjectURL(blob as any)
}

async function initOptions(opts: Opts) {
    const { autoPlay, scripts } = opts

    const scriptList = scripts || ([] as ScriptItem[])
    if (autoPlay) {
        scriptList.push({
            name: 'web-replay-init',
            src: `wr.replay()`
        })
    }
    await injectScripts(scriptList)
}

async function injectScripts(scripts?: ScriptItem[]) {
    if (scripts) {
        for (let scriptItem of scripts) {
            const { src, name } = scriptItem
            let scriptContent = src
            const script = document.createElement('script')
            script.id = name
            const isUrlReg = /:\/\//
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

async function injectData() {
    const dataScript = document.createElement('script')
    const data = window.__ReplayData__ || (await (await DB).getData())
    const jsonStrData = JSON.stringify(data)
    const zipArray = pako.gzip(jsonStrData)
    const scriptContent = `var __ReplayStrData__ = ${"'" + zipArray.toString() + "'"}`
    dataScript.innerText = scriptContent
    html.body.insertBefore(dataScript, html.body.firstChild)
}
