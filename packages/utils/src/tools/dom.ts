import { isDev } from './common'

const snapshot = () => window.__ReplayData__ && window.__ReplayData__.snapshot.data
const origin = () => (snapshot() && snapshot().origin) || location.origin
const protocol = () => origin().match(/.*?\/\//)![0] || location.protocol
const href = () => origin() + ((snapshot() && snapshot().pathname) || location.pathname)

export function filteringTemplate(tpl: string) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    if (isDev) {
        tpl = tpl.replace(reg, '')
    }
    return tpl
}

export function isCommentNode(node: Node) {
    return node.nodeType === Node.COMMENT_NODE
}

export function isElementNode(node: Node) {
    return node.nodeType === Node.ELEMENT_NODE
}

export function isTextNode(node: Node) {
    return node.nodeType === Node.TEXT_NODE
}

export function filteringScriptTag(str: string) {
    const reg = /<\/script>/g
    return str.replace(reg, '<\\/script>')
}

function startsWithSlash(str: string) {
    return /^\/(?!\/)/.test(str)
}

function startsWithDoubleSlash(str: string) {
    return /^\/\//.test(str)
}

export function proxyResource(url: string) {
    const { proxy } = window.__ReplayOptions__

    if (proxy) {
        const proxyUrl = stitchingLink(proxy, url)
        return proxyUrl
    }
    return url
}

function stitchingLink(pre: string, next: string) {
    if (pre.endsWith('/') || next.startsWith('/')) {
        return pre + next
    }
    return pre + '/' + next
}

export function completionCssHref(str: string) {
    return str.replace(/(url\()['"]?((\/{1,2})[^'"]*?)['"]?(?=\))/g, (a, b, c) => {
        let url: string = ''
        if (startsWithDoubleSlash(c)) {
            url = stitchingLink(protocol(), c.substring(2))
        } else if (startsWithSlash(c)) {
            url = stitchingLink(origin(), c.substring(1))
        }
        if (url) {
            return a.replace(c, url)
        }
        return a
    })
}

export function completionAttrHref(str: string, node?: Element) {
    if (str.startsWith('data')) {
        return str
    }

    const reg = /^(\/{1,2}.*)/g
    str = str.replace(reg, str => {
        if (startsWithDoubleSlash(str)) {
            return stitchingLink(protocol(), str.substring(2))
        }

        if (startsWithSlash(str)) {
            return stitchingLink(origin(), str)
        }
        return str
    })

    if (!/^http/.test(str)) {
        if (str.startsWith('./')) {
            return stitchingLink(href(), str.substring(1))
        } else {
            // Use the async way to get the Context by reference after the node is inserted into the iframe
            if (node) {
                setTimeout(() => updateNodeAttrHref(node as HTMLElement, str))
            }

            // prevent load source
            return ''
        }
    }

    return str
}

function updateNodeAttrHref(node: HTMLElement, str: string) {
    const doc = node.getRootNode() as Document
    const context = doc.defaultView as Window

    let { path } = context.__ReplayLocation__
    path = path.replace(/(\/[\w\/]+)\/\w+\/{0,}/, '$1').replace(/\/*$/, '')

    const attrs = node.getAttributeNames()
    attrs
        .filter(key => ~['src', 'href'].indexOf(key))
        .forEach(key => {
            node.setAttribute(key, stitchingLink(origin() + path, str))
        })
}

export function isHideComment(node: Node | null) {
    if (!node) {
        return false
    }
    return node.nodeType === Node.COMMENT_NODE && node.textContent === 'hidden'
}

export function isExistingNode(node: Node) {
    return node.ownerDocument && !!node.ownerDocument.contains(node)
}

export async function getRawScriptContent(src: string) {
    if (!src) {
        return false
    }
    if (src.length > 500) {
        return false
    }

    const fullSrc = completionAttrHref(src)
    if (isValidUrl(fullSrc)) {
        try {
            return await getScript(fullSrc)
        } catch (err) {
            // handle cross error
            return false
        }
    }

    return false
}

function isValidUrl(url: string) {
    try {
        new URL(url)
    } catch (_) {
        return false
    }
    return true
}

export async function getScript(src: string) {
    return await fetch(src).then(async res => filteringScriptTag(await res.text()))
}
