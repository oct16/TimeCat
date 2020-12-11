import { VNode } from '@timecat/share'
import { logError, createURL } from '@timecat/utils'

export function rewriteNodes(vNodes: VNode[]) {
    const { G_RECORD_OPTIONS: options } = window
    const { rewriteResource } = options

    if (!rewriteResource) {
        return
    }
    const { replaceOrigin, folderPath, fn, matches } = rewriteResource

    if (!replaceOrigin || !matches) {
        return logError('The params replaceOrigin and matches is required for using rewriteResource')
    }

    const [base] = document.getElementsByTagName('base')
    const href = window.location.href

    const rewriteNodeSrc = (node: VNode) => {
        const { href, src } = node.attrs
        Object.entries({ href, src })
            .filter(([, source]) => source && (matches as string[]).some(item => source.endsWith('.' + item)))
            .forEach(item => rewrite(node.attrs, item))
    }

    const rewrite = (target: { [key: string]: string }, [key, source]: [string, string]) => {
        const url = createURL(source, base?.href || href)
        const oldUrl = url.href

        target[key] = createURL(url.pathname, replaceOrigin).href
        target[key] = pathJoin(replaceOrigin, folderPath || '', url.pathname)
        const nextUrl = target[key]

        fn && fn(oldUrl, nextUrl)
    }

    vNodes.forEach(rewriteNodeSrc)
}

function pathJoin(...urls: string[]) {
    if (!urls.length) {
        return ''
    }

    if (urls.length === 1) {
        return urls[0]
    }

    function pureEnd(path: string) {
        return path.endsWith('/') ? path.substring(0, path.length - 1) : path
    }
    function pureStart(path: string) {
        return path.startsWith('/') ? path.substring(1) : path
    }

    return urls.reduce((url, path) => {
        if (!url) {
            if (!path.startsWith('http')) {
                throw new Error('path error')
            }
            return pureEnd(path)
        }
        return url + (path ? '/' + pureStart(pureEnd(path)) : '')
    }, '')
}
