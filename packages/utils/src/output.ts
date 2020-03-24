import replayTpl from '../../../tpls/replay.html'
import { DBPromise as DB } from './store/idb'
import { filteringScriptTag } from './tool'

type Opts = { scripts?: string[]; autoPlay?: boolean }
const parser = new DOMParser()
const html = parser.parseFromString(replayTpl, 'text/html')

export async function exportReplay(opts: Opts = {}) {
    await injectData()
    await initOptions(opts)
    createAndDownloadFile(`Replay-${Date.now()}`, html.documentElement.outerHTML)
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

    const sList = scripts || []
    if (autoPlay) {
        sList.push(`wr.replay()`)
    }

    await injectScripts(sList)
}

async function injectScripts(scripts?: string[]) {
    if (scripts) {
        for (let source of scripts) {
            let scriptContent: string = source
            if (/:\/\//.test(source)) {
                const src = source
                scriptContent = await getScript(src)
            }
            const inlineScript = document.createElement('script')
            inlineScript.text = scriptContent
            html.body.appendChild(inlineScript)
        }
    }

    // const scripts = html.getElementsByTagName('script')
    // else if (scripts) {
    // for (let script of scripts) {
    //     if (script.hasAttribute('src')) {
    //         const src = script.src
    //         const scriptContent = await getScript(src)
    //         if (scriptContent) {
    //             const tag = script.outerHTML
    //             const comment = document.createComment(`convert to inline ${tag}`)
    //             html.body.replaceChild(comment, script)

    //             const inlineScript = document.createElement('script')
    //             inlineScript.innerHTML = scriptContent
    //             html.body.insertBefore(inlineScript, comment)
    //         }
    //     }
    // }
    // }
}

async function getScript(src: string) {
    return await fetch(src)
        .then(res => res.text())
        .then(filteringScriptTag)
}

async function injectData() {
    const data = await (await DB).getData()
    const jsonData = JSON.stringify(data)
    const dataScript = document.createElement('script')
    const scriptContent = `var __ReplayData__ = ${jsonData}`
    dataScript.innerText = scriptContent
    html.body.insertBefore(dataScript, html.body.firstChild)
}
