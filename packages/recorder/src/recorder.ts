/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { watchers, baseWatchers } from './watchers'
import { AudioWatcher } from './audio'
import { RecordData, RecordType, TerminateRecord } from '@timecat/share'
import { logError, nodeStore, getTime, tempEmptyFn, tempEmptyPromise, IDB, idb, delay } from '@timecat/utils'
import { Snapshot } from './snapshot'
import { getHeadData } from './head'
import { LocationWatcher } from './watchers/location'
import { Pluginable } from './pluginable'
import { Watcher } from './watcher'
import { VideoWatcher } from './watchers/video'
import { RecorderMiddleware, RecorderStatus, RecordInternalOptions, RecordOptions } from './types'

export class Recorder {
    public startTime: number
    public destroyTime: number
    public status: RecorderStatus = RecorderStatus.PAUSE
    public onData: RecorderModule['onData'] = tempEmptyFn
    public destroy: RecorderModule['destroy'] = tempEmptyPromise
    public pause: RecorderModule['pause'] = tempEmptyPromise as RecorderModule['pause']
    public record: RecorderModule['record'] = tempEmptyPromise as RecorderModule['record']
    public use: RecorderModule['use'] = tempEmptyFn
    public clearDB: RecorderModule['clearDB'] = tempEmptyPromise
    constructor(options?: RecordOptions) {
        const recorder = new RecorderModule(options)
        Object.keys(this).forEach((key: keyof Recorder) => {
            Object.defineProperty(this, key, {
                get() {
                    return typeof recorder[key] === 'function'
                        ? (recorder[key] as Function).bind(recorder)
                        : recorder[key]
                }
            })
        })
    }
}

export class RecorderModule extends Pluginable {
    private static defaultRecordOpts = {
        mode: 'default',
        write: true,
        keep: false,
        audio: false,
        video: false,
        emitLocationImmediate: true,
        context: window,
        rewriteResource: [],
        disableWatchers: []
    } as RecordOptions
    private defaultMiddlewares: RecorderMiddleware[] = []
    private destroyStore: Set<Function> = new Set()
    private listenStore: Set<Function> = new Set()
    private middlewares: RecorderMiddleware[] = [...this.defaultMiddlewares]
    private watchers: Array<typeof Watcher>
    private watchersInstance = new Map<string, Watcher<RecordData>>()
    private watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve))
    private watcherResolve: Function
    private startTime: number
    private destroyTime: number

    public status: RecorderStatus = RecorderStatus.PAUSE
    public db: IDB
    public options: RecordInternalOptions

    constructor(options?: RecordOptions) {
        super(options)
        const opts = this.initOptions(options)
        opts.rootContext = opts.rootContext || opts.context
        this.options = opts
        this.watchers = this.getWatchers() as typeof Watcher[]
        this.init()
    }

    private initOptions(options?: RecordOptions) {
        const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
        if (opts.video === true) {
            opts.video = { fps: 24 }
        } else if (opts.video && 'fps' in opts.video) {
            if (opts.video.fps > 24) {
                opts.video.fps = 24
            }
        }
        return opts
    }

    private init() {
        this.startTime = getTime()
        const options = this.options
        this.db = idb
        this.loadPlugins()
        this.hooks.beforeRun.call(this)
        this.record(options)
        this.hooks.run.call(this)
    }

    public onData(fn: (data: RecordData, next: () => Promise<void>) => Promise<void>) {
        this.middlewares.unshift(fn)
    }

    public async destroy() {
        if (this.status === RecorderStatus.HALT) {
            return
        }
        const ret = await this.pause()
        if (ret) {
            this.status = RecorderStatus.HALT
            this.destroyTime = ret.lastTime || getTime()
        }
    }

    private async pause() {
        if (this.status === RecorderStatus.RUNNING) {
            this.status = RecorderStatus.PAUSE
            const last = await this.db.last().catch(() => {})

            await this.cancelListener()
            this.destroyStore.forEach(un => un())
            this.destroyStore.clear()

            let lastTime: number | null = null
            if (last) {
                lastTime = last.time + 1
                const data = {
                    type: RecordType.TERMINATE,
                    data: null,
                    relatedId: window.G_RECORD_RELATED_ID,
                    time: lastTime
                }

                if (data.relatedId) {
                    if (this.options.write) {
                        this.db.add(data as TerminateRecord)
                    }
                    this.connectCompose(this.middlewares)(data as RecordData)
                }
            }
            return { lastTime }
        }
    }

    public clearDB() {
        this.db.clear()
    }

    private async cancelListener() {
        // wait for watchers loaded
        await this.watchesReadyPromise
        this.listenStore.forEach(un => un())
        this.listenStore.clear()
        nodeStore.reset()
    }

    private getWatchers() {
        const { video, audio, disableWatchers } = this.options
        const watchersList = [Snapshot, ...Object.values(watchers)] as typeof Watcher[]
        if (audio) {
            watchersList.push(AudioWatcher as typeof Watcher)
        }
        if (video) {
            watchersList.push(VideoWatcher as typeof Watcher)
        }

        return watchersList.filter(watcher => {
            return !~disableWatchers.indexOf(watcher.name as keyof typeof watchers)
        })
    }

    private record(options: RecordOptions | RecordInternalOptions): void {
        if (this.status === RecorderStatus.PAUSE) {
            const opts = { ...RecorderModule.defaultRecordOpts, ...options } as RecordInternalOptions
            this.startRecord((opts.context.G_RECORD_OPTIONS = opts))
            return
        }
    }

    private async startRecord(options: RecordInternalOptions) {
        let activeWatchers = [...this.watchers, ...this.pluginWatchers]

        const isSameCtx = options.context === this.options.rootContext
        if (isSameCtx) {
            if (!options.keep) {
                this.db.clear()
            }
            this.status = RecorderStatus.RUNNING
        } else {
            // for iframe watchers
            activeWatchers = [Snapshot, ...Object.values(baseWatchers)] as typeof Watcher[]
        }

        const onEmit = (options: RecordOptions) => {
            const { write } = options
            const emitTasks: Array<RecordData> = []

            const execTasksChain = (() => {
                let concurrency = 0
                const MAX_CONCURRENCY = 1
                return async () => {
                    if (concurrency >= MAX_CONCURRENCY) {
                        return
                    }
                    concurrency++
                    while (emitTasks.length) {
                        const record = emitTasks.shift()!
                        await delay(0)
                        if (this.status === RecorderStatus.RUNNING) {
                            if (write) {
                                this.db.add(record)
                            }
                            await this.connectCompose(this.middlewares)(record)
                            this.hooks.emit.call(record)
                        }
                    }
                    concurrency--
                }
            })()

            return (data: RecordData) => {
                if (!data) {
                    return
                }

                emitTasks.push(data)
                execTasksChain()
            }
        }

        const emit = onEmit(options)
        const headData = getHeadData()
        const relatedId = headData.relatedId
        options.context.G_RECORD_RELATED_ID = relatedId

        const isInRoot = options.context === this.options.rootContext
        if (isInRoot) {
            emit({
                type: RecordType.HEAD,
                data: headData,
                relatedId,
                time: getTime()
            })
        }

        activeWatchers.forEach(Watcher => {
            try {
                const watcher = new Watcher({
                    recorder: this,
                    context: options && options.context,
                    listenStore: this.listenStore,
                    relatedId,
                    emit,
                    watchers: this.watchersInstance
                })
                this.watchersInstance.set(Watcher.name, watcher)
            } catch (e) {
                logError(e)
            }
        })

        if (isInRoot && options.emitLocationImmediate) {
            const locationInstance = this.watchersInstance.get(LocationWatcher.name) as InstanceType<
                typeof LocationWatcher
            >
            locationInstance?.emitOne()
        }

        this.watcherResolve()
        await this.recordSubIFrames(options.context)
    }

    private async waitingSubIFramesLoaded(context: Window) {
        const frames = context.frames
        const validFrames = Array.from(frames)
            .filter(frame => {
                try {
                    return frame.frameElement && frame.frameElement.getAttribute('src')
                } catch (e) {
                    logError(e)
                    return false
                }
            })
            .map(async frame => {
                await delay(0)
                return await new Promise(resolve => {
                    if (frame.document.readyState === 'complete') {
                        resolve(frame)
                    } else {
                        frame.addEventListener('load', () => {
                            resolve(frame)
                        })
                    }
                })
            })
        if (!validFrames.length) {
            return Promise.resolve([])
        }
        return Promise.all(validFrames) as Promise<Window[]>
    }

    private async waitingIFrameLoaded(frame: Window): Promise<Window | undefined> {
        try {
            frame.document && frame.frameElement && frame.frameElement.getAttribute('src')!
        } catch (e) {
            logError(e)
            return
        }

        return new Promise(resolve => {
            const timer = window.setInterval(() => {
                try {
                    if (frame.document) {
                        clearInterval(timer)
                        resolve(frame)
                    }
                } catch (e) {
                    logError(e)
                    clearInterval(timer)
                    resolve(undefined)
                }
            }, 200)
        })
    }

    public async recordSubIFrames(context: Window) {
        const frames = await this.waitingSubIFramesLoaded(context)
        frames.forEach(frameWindow => {
            this.createIFrameRecorder(frameWindow)
        })
    }

    public async recordIFrame(context: Window) {
        const frameWindow = await this.waitingIFrameLoaded(context)
        if (frameWindow) {
            this.createIFrameRecorder(frameWindow)
        }
    }

    private createIFrameRecorder(frameWindow: Window) {
        const frameRecorder = new RecorderModule({
            ...this.options,
            context: frameWindow,
            keep: true,
            rootContext: this.options.rootContext
        })
        const frameElement = frameWindow.frameElement as Element & { frameRecorder: RecorderModule }
        frameElement.frameRecorder = frameRecorder
        this.destroyStore.add(() => frameRecorder.destroy())
    }

    private connectCompose(list: RecorderMiddleware[]) {
        return async (data: RecordData) => {
            return await list.reduce(
                (next: () => Promise<void>, fn: RecorderMiddleware) => {
                    return this.createNext(fn, data, next)
                },
                () => Promise.resolve()
            )()
        }
    }

    private createNext(fn: RecorderMiddleware, data: RecordData, next: () => Promise<void>) {
        return async () => await fn(data, next)
    }
}
