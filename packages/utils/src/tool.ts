const origin = (window.__ReplayData__ && window.__ReplayData__.origin) || location.origin
const protocol = origin.match(/.*?\/\//)![0] || location.protocol
const href = origin + ((window.__ReplayData__ && window.__ReplayData__.pathname) || location.pathname)
export const isDev = process.env.NODE_ENV === 'development'

export function secondToDate(ms: number) {
    if (ms <= 0) {
        ms = 0
    }
    const [h, m, s] = [Math.floor(ms / 3600), Math.floor((ms / 60) % 60), Math.floor(ms % 60)]
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':')
    return timeStr.replace(/^00\:/, '')
}

export function getTime() {
    return performance.timing.navigationStart + performance.now()
}

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
            url = protocol + c.substring(2)
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
            return protocol + str.substring(2)
        }

        if (startsWithSlash(str)) {
            return origin + str
        }
        return str
    })

    if (!/^http/.test(str)) {
        if (str.startsWith('./')) {
            return href + str.substring(1)
        } else {
            return href + str
        }
    }

    return str
}

export function logger(data: any) {
    console.log('record', data)
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

export function getAllChildNodes(nodes: Node[], resultSet: Set<Node> = new Set()) {
    if (!nodes || !nodes.length) {
        return resultSet
    }
    nodes.forEach(node => {
        resultSet.add(node)
        if (node.childNodes) {
            getAllChildNodes([...node.childNodes], resultSet)
        }
    })
    return resultSet
}
