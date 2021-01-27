/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PreFetchRecordData, VNode } from '@timecat/share'
import { logError, createURL, completeCssHref, getTime, logWarn } from '@timecat/utils'
import { RewriteItem, RewriteItemType, RewriteResource } from './recorder'

// https://github.com/gnuns/allorigins
// Pull contents from any page and avoid Same-origin policy problems

const defaultCrossUrl = 'https://timecatjs.com/all-origins?url='

export function rewriteNodes(
    vNodes: VNode[],
    configs: RewriteResource,
    preFetchCallback: (data: PreFetchRecordData) => void
) {
    if (!configs) {
        return
    }

    const { rewriteConfigs, preFetchConfigs } = configs.reduce(
        (collect, config) => {
            if (config.type === RewriteItemType.preFetch) {
                collect.preFetchConfigs.push(config as RewriteItem<RewriteItemType.preFetch>)
            } else {
                collect.rewriteConfigs.push(config as RewriteItem<RewriteItemType.rewrite>)
            }
            return collect
        },
        { rewriteConfigs: [], preFetchConfigs: [] } as {
            rewriteConfigs: RewriteItem<RewriteItemType.rewrite>[]
            preFetchConfigs: RewriteItem<RewriteItemType.preFetch>[]
        }
    )

    if (
        rewriteConfigs.some(config => {
            const { matches, rewrite } = config
            const { replaceOrigin } = rewrite
            return !replaceOrigin || !matches
        })
    ) {
        return logError('The params replaceOrigin and matches is required for using rewriteResource')
    }

    function matchNodeSource(node: VNode, matches: (string | RegExp)[]) {
        return (func: (node: VNode, key: string, val: string) => void) => {
            const { href, src } = node.attrs
            Object.entries({ href, src })
                .filter(([, source]) => {
                    if (!source) {
                        return
                    }
                    return matches.some(item => {
                        if (typeof item === 'string') {
                            return source.endsWith('.' + item)
                        }
                        return (item as RegExp).test(source)
                    })
                })
                .forEach(item => func(node, ...item))
        }
    }

    rewriteConfigs.forEach(config => {
        const { rewrite, matches } = config
        const { replaceOrigin, folderPath, fn } = rewrite
        const [base] = document.getElementsByTagName('base')
        const href = window.location.href

        const rewriteNode = (node: VNode) => matchNodeSource(node, matches)(rewriteAttr)

        const rewriteAttr = (vNode: VNode, key: string, source: string) => {
            const target = vNode.attrs
            const url = createURL(source, base?.href || href)
            const oldUrl = url.href

            const nextUrl = pathJoin(replaceOrigin!, folderPath || '', url.pathname)
            const targetUrl = (fn && fn(oldUrl, nextUrl)) || nextUrl
            target[key] = targetUrl
        }

        vNodes.forEach(rewriteNode)
    })

    preFetchConfigs.forEach(config => {
        const { rewrite, matches } = config
        const strMatches = matches.filter(m => typeof m === 'string')

        if (!strMatches.every(s => (s as string).endsWith('css'))) {
            return logError('PreFetch Resource only support [css] currently')
        }

        const { replaceOrigin, folderPath, crossUrl, fn, matches: subMatches } = rewrite
        const [base] = document.getElementsByTagName('base')
        const href = window.location.href

        const rewriteNode = (node: VNode) => matchNodeSource(node, matches)(preFetchSource)

        const preFetchSource = async (vNode: VNode, key: string, source: string) => {
            const url = createURL(source, base?.href || href)

            const resText = await fetch(url.href)
                .then(
                    res => res.text(),
                    () => ''
                )
                .catch(err => logWarn(err))

            if (!resText) {
                return
            }

            const text = completeCssHref(resText, url.href, preUrl => {
                if (!subMatches) {
                    return preUrl
                }

                let nextUrl: string
                const url = createURL(preUrl, base?.href || href)
                const anyMatched = subMatches.some(item => {
                    if (typeof item === 'string') {
                        return url.pathname.endsWith('.' + item)
                    }
                    return (item as RegExp).test(preUrl)
                })

                if (!anyMatched) {
                    return preUrl
                }

                if (replaceOrigin && folderPath) {
                    nextUrl = pathJoin(replaceOrigin, folderPath || '', url.pathname)
                } else {
                    nextUrl = getCrossOriginUrl(preUrl, crossUrl)
                }
                return (fn && fn(preUrl, nextUrl)) || nextUrl
            })

            const data: PreFetchRecordData = {
                id: vNode.id,
                tag: vNode.tag,
                key,
                time: getTime(),
                url: url.href,
                text
            }

            preFetchCallback(data)
        }

        vNodes.forEach(rewriteNode)
    })
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

function getCrossOriginUrl(preUrl: string, crossUrl?: string) {
    const encodeUrl = encodeURIComponent(preUrl)
    let nextUrl: string
    if (crossUrl && typeof crossUrl === 'string') {
        if (~crossUrl.indexOf('<$url>')) {
            nextUrl = crossUrl.replace('<$url>', encodeUrl)
        } else {
            nextUrl = crossUrl + encodeUrl
        }
    } else {
        nextUrl = defaultCrossUrl + encodeUrl
    }
    return nextUrl
}
