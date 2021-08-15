import { RecordData } from '@timecat/share'
import { RecorderPlugin } from './pluginable'
import { watchers } from './watchers'

export type RecorderMiddleware = (data: RecordData, n: () => Promise<void>) => Promise<void>

interface RecordVideoOptions {
    fps: number
}

interface RecordOptionsBase {
    context?: Window
    rootContext?: Window
    audio?: boolean
    video?: boolean | RecordVideoOptions
    write?: boolean
    keep?: boolean
    emitLocationImmediate?: boolean
    font?: boolean
    disableWatchers?: Array<keyof typeof watchers>
    keepAlive?: number | false
}

export interface RecordInternalOptions extends Required<RecordOptions> {
    context: Window
    video: boolean | RecordVideoOptions
}

interface RewriteConfig {
    replaceOrigin?: string
    folderPath?: string
    fn?: (pre: string, next: string) => string | void
}

interface PreFetchRewriteConfig extends RewriteConfig {
    matches?: (string | RegExp)[]
    crossUrl?: string
}

export type RewriteResource = RewriteItem[]

export enum RecorderStatus {
    RUNNING = 'running',
    PAUSE = 'pause',
    HALT = 'halt'
}

export interface RecordOptions extends RecordOptionsBase {
    plugins?: RecorderPlugin[]
    rewriteResource?: RewriteResource
}

export interface RewriteItem {
    matches: (string | RegExp)[]
    type?: string
    rewrite: PreFetchRewriteConfig & RewriteConfig
}
