import { VNode } from '@timecat/share'
import { logError } from '@timecat/utils'

export function rewriteNodes(vNodes: VNode[]) {
    const { G_RECORD_OPTIONS: options } = window
    const { rewriteResource } = options

    if (!rewriteResource) {
        return
    }
    const { replaceOrigin, fn, matches } = rewriteResource
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
        const url = new URL(source, base?.href || href)
        const oldUrl = url.href

        target[key] = new URL(url.pathname, replaceOrigin).href
        const nextUrl = target[key]

        fn && fn(oldUrl, nextUrl)
    }

    vNodes.forEach(rewriteNodeSrc)
}
