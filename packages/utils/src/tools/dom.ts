import { VNode } from '@timecat/share'
import { logError } from './common'

const snapshot = () => window.G_REPLAY_DATA && window.G_REPLAY_DATA.snapshot.data

const href = () => snapshot().href

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

export function completeCssHref(str: string, parentVNode?: VNode) {
    return str.replace(/(url\(['"]?((\/{1,2}|\.\.?\/)?[^'"]*?)['"]?(?=\)))/g, (string, b, url) => {
        if (!url.startsWith('data')) {
            const baseUrl = parentVNode?.attrs['css-url'] || href()
            const newUrl = new URL(url, baseUrl)
            return string.replace(url, newUrl.href)
        }
        return string
    })
}

export function completeAttrHref(str: string, node?: Element) {
    if (str.startsWith('data')) {
        return str
    }

    if (node) {
        setTimeout(() => {
            const doc = node.getRootNode() as Document
            const context = doc.defaultView as Window

            const { href, path } = context?.G_REPLAY_LOCATION || {}

            if (path && href) {
                const relationHref = new URL(path, href)
                const attrs = node.getAttributeNames()
                attrs
                    .filter(key => ~['src', 'href'].indexOf(key))
                    .forEach(key => {
                        const newHref = new URL(str, relationHref).href
                        if (node.getAttribute(key) !== newHref) {
                            node.setAttribute(key, newHref)
                        }
                    })
            }
        })
    }
    return new URL(str, href()).href
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

    const fullSrc = completeAttrHref(src)

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
    return await fetch(src).then(
        async res => filteringScriptTag(await res.text()),
        reason => {
            logError(reason)
            return src
        }
    )
}
