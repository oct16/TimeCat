import tpl from '../../../tpls/replay.html'
import { DBPromise as DB, filteringScriptTag } from '@WebReplay/utils'
export async function exportHTML() {
    const parser = new DOMParser()

    const html = parser.parseFromString(tpl, 'text/html')

    await makeExternalToInline(html)
    await joinData(html)

    createAndDownloadFile(`Replay-${Date.now()}`, html.documentElement.outerHTML)
}

function createAndDownloadFile(fileName: string, content: string) {
    var aTag = document.createElement('a')
    var blob = new Blob([content], {type: 'text/html'})
    aTag.download = fileName + '.html'
    aTag.href = URL.createObjectURL(blob)
    aTag.click()
    URL.revokeObjectURL(blob as any)
}

async function makeExternalToInline(doc: Document) {
    const scripts = doc.getElementsByTagName('script')

    if (scripts) {
        for (let script of scripts) {
            if (script.hasAttribute('src')) {
                const src = script.src
                const tag = script.outerHTML
                const comment = document.createComment(`convert to inline ${tag}`)
                doc.body.replaceChild(comment, script)

                const scriptContent = await getScript(src)
                const inlineScript = document.createElement('script')
                inlineScript.innerHTML = scriptContent
                doc.body.insertBefore(inlineScript, comment)
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


