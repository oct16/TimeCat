/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LocationRecord, RecordType } from '@timecat/share'
import { Watcher } from '../watcher'

enum MethodType {
    'add' = 'add',
    'rm' = 'rm'
}

enum LocationTypes {
    'replaceState' = 'replaceState',
    'pushState' = 'pushState',
    'popstate' = 'popstate',
    'hashchange' = 'hashchange'
}

export class LocationWatcher extends Watcher<LocationRecord> {
    protected init() {
        this.context.history.pushState = this.kidnapLocation(LocationTypes.pushState)
        this.context.history.replaceState = this.kidnapLocation(LocationTypes.replaceState)

        const types = Object.values(LocationTypes)

        types.forEach(type => this.toggleListener(MethodType.add, type, this.locationHandle))

        this.uninstall(() => {
            types.forEach(type => this.toggleListener(MethodType.rm, type, this.locationHandle))
        })
    }

    private toggleListener(
        methodType: keyof typeof MethodType,
        type: string,
        handle: EventListenerOrEventListenerObject
    ) {
        this.context[methodType === MethodType.add ? 'addEventListener' : 'removeEventListener'](type, handle)
    }

    private kidnapLocation(type: LocationTypes.pushState | LocationTypes.replaceState) {
        const ctx = this.context
        const original = ctx.history[type]

        return function (this: any) {
            const result = original.apply(this, arguments)
            const e = new Event(type)
            e.arguments = arguments
            ctx.dispatchEvent(e)
            return result
        }
    }

    private locationHandle = (e: Event) => {
        const contextNodeId = this.getContextNodeId(e)
        const [, , path] = e.arguments || [, , this.context?.location?.pathname]
        const [base] = this.context.document.body.getElementsByTagName('base')
        const { href, hash } = this.context.location
        const title = document.title
        this.emitData(RecordType.LOCATION, {
            contextNodeId,
            href: base?.href || href,
            hash,
            path,
            title
        })
    }

    public emitOne = () => this.locationHandle(({ target: window } as unknown) as Event)

    private getContextNodeId(e: Event) {
        return this.getNodeId((e.target as Window).document.documentElement)!
    }
}
