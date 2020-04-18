import { isDev } from './common'

const origin = () => (window.__ReplayData__ && window.__ReplayData__.origin) || location.origin
const protocol = () => origin().match(/.*?\/\//)![0] || location.protocol
const href = () => origin() + ((window.__ReplayData__ && window.__ReplayData__.pathname) || location.pathname)

export function filteringTemplate(tpl: string) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    if (isDev) {
        tpl = tpl.replace(reg, '')
    }
    return tpl
}

export function isCommentStr(str: string) {
    return str.startsWith('<!--') && str.endsWith('-->')
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

export function createCommentText(str: string) {
    return `<!--` + str + `-->`
}

export function getPos(node: Node) {
    return [...node.parentNode!.childNodes].indexOf(node as Element)
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

export function completionCssHref(str: string) {
    return str.replace(/(url\()['"]?((\/{1,2})[^'"]*?)['"]?(?=\))/g, (a, b, c) => {
        let url: string = ''
        if (startsWithDoubleSlash(c)) {
            url = protocol() + c.substring(2)
        } else if (startsWithSlash(c)) {
            url = origin + c.substring(1)
        }
        if (url) {
            return a.replace(c, url)
        }
        return a
    })
}

export function completionAttrHref(str: string) {
    if (str.startsWith('data')) {
        return str
    }

    const reg = /^(\/{1,2}.*)/g
    str = str.replace(reg, str => {
        if (startsWithDoubleSlash(str)) {
            return protocol() + str.substring(2)
        }

        if (startsWithSlash(str)) {
            return origin() + str
        }
        return str
    })

    if (!/^http/.test(str)) {
        if (str.startsWith('./')) {
            return href() + str.substring(1)
        } else {
            return href() + str
        }
    }

    return str
}

export function removeItem(array: any[], item: any) {
    if (!Array.isArray(array)) {
        return
    }
    const index = array.indexOf(item)
    if (~index) {
        array.splice(index, 1)
    }
}

export function swapNode(nodeA: Node, nodeB: Node) {
    if (nodeA && nodeB) {
        const parentNodeA = nodeA.parentNode!
        const tempA = document.createElement('span')
        parentNodeA.insertBefore(tempA, nodeA)

        const parentNodeB = nodeB.parentNode!
        const tempB = document.createElement('span')
        parentNodeB.insertBefore(tempB, nodeB)

        parentNodeA.insertBefore(nodeB, tempA)
        parentNodeB.insertBefore(nodeA, tempB)

        parentNodeA.removeChild(tempA)
        parentNodeB.removeChild(tempB)
    }
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

export function moveNodeTo(node: Element, pos: number, parentNode?: Node) {
    if (!node || !isExistingNode(node) || !node.parentNode) {
        return
    }
    const pNode = parentNode || node.parentNode!
    const curPos = getPos(node)
    if (pNode !== node.parentNode || pos < curPos) {
        pNode.insertBefore(node, pNode.childNodes[pos])
    } else {
        pNode.insertBefore(node, pNode.childNodes[pos + 1])
    }
}
