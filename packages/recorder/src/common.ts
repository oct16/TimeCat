/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PreFetchRecordData, VNode } from '@timecat/share'
import { logError, createURL, getTime, completeCssHref } from '@timecat/utils'
import { RewriteItem, RewriteResource } from './recorder'

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
            if (config.type === 'preFetch') {
                collect.preFetchConfigs.push(config as RewriteItem<'preFetch'>)
            } else {
                collect.rewriteConfigs.push(config as RewriteItem<'rewrite'>)
            }
            return collect
        },
        { rewriteConfigs: [], preFetchConfigs: [] } as {
            rewriteConfigs: RewriteItem<'rewrite'>[]
            preFetchConfigs: RewriteItem<'preFetch'>[]
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
                            return source.endsWith(item)
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
        const { replaceOrigin, folderPath, crossUrl, fn, matches: subMatches } = rewrite
        const [base] = document.getElementsByTagName('base')
        const href = window.location.href

        const rewriteNode = (node: VNode) => matchNodeSource(node, matches)(preFetchSource)

        const preFetchSource = async (vNode: VNode, key: string, source: string) => {
            const url = createURL(source, base?.href || href)
            const resText = await fetch(crossOriginUrl(url.href)).then(res => res.text())
            const fetchTime = getTime()

            const text = completeCssHref(resText, undefined, preUrl => {
                if (!subMatches) {
                    return preUrl
                }

                const anyMatched = subMatches.some(item => {
                    if (typeof item === 'string') {
                        return preUrl.endsWith(item)
                    }
                    return (item as RegExp).test(preUrl)
                })

                if (!anyMatched) {
                    return preUrl
                }

                let nextUrl: string
                if (replaceOrigin && folderPath) {
                    const url = createURL(preUrl, base?.href || href)
                    nextUrl = pathJoin(replaceOrigin, folderPath || '', url.pathname)
                } else {
                    if (typeof crossUrl === 'string') {
                        nextUrl = crossUrl + preUrl
                    } else {
                        nextUrl = crossOriginUrl(preUrl)
                    }
                }
                return (fn && fn(preUrl, nextUrl)) || nextUrl
            })

            const data: PreFetchRecordData = {
                id: vNode.id,
                tag: vNode.tag,
                key,
                time: fetchTime,
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

function crossOriginUrl(url: string) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
}
