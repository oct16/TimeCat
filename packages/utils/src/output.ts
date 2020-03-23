import replayTpl from '../../../tpls/replay.html'
import { DBPromise as DB } from './store/idb'
import { filteringScriptTag } from './tool'
export async function exportReplay(opt?: { injectScripts: string[] }) {
    const parser = new DOMParser()
    const html = parser.parseFromString(replayTpl, 'text/html')
    await makeExternalToInline(html, opt && opt.injectScripts)
    await joinData(html)

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

async function makeExternalToInline(html: Document, injectScripts?: string[]) {
    const scripts = html.getElementsByTagName('script')

    if (injectScripts) {
        for (let src of injectScripts) {
            const scriptContent = await getScript(src)
            const inlineScript = document.createElement('script')
            inlineScript.innerHTML = scriptContent
            const firstChild = html.body.firstChild

            if (firstChild) {
                html.body.insertBefore(inlineScript, firstChild)
            } else {
                html.body.appendChild(inlineScript)
            }
        }
    } else if (scripts) {
        for (let script of scripts) {
            if (script.hasAttribute('src')) {
                const src = script.src
                const scriptContent = await getScript(src)
                if (scriptContent) {
                    const tag = script.outerHTML
                    const comment = document.createComment(`convert to inline ${tag}`)
                    html.body.replaceChild(comment, script)

                    const inlineScript = document.createElement('script')
                    inlineScript.innerHTML = scriptContent
                    html.body.insertBefore(inlineScript, comment)
                }
            }
        }
    }
}

async function getScript(src: string) {
    return await fetch(src).then(res => res.text()).then(filteringScriptTag)
}

async function joinData(doc: Document) {
    const data = await (await DB).getData()
    const jsonData = JSON.stringify(data)
    const dataScript = document.createElement('script')
    const scriptContent = `var __ReplayData__ = ${jsonData}`
    dataScript.innerText = scriptContent
    doc.body.insertBefore(dataScript, doc.body.firstChild)
}
