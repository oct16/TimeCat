## Quick Start

> TimeCat is going rapid iteration, The API may change frequently, Please pay attention to documentation updates, If you have any questions, please contact the author

#### Import TimeCat
```ts
// from module
import { Recorder, Player } from 'timecatjs';
 // or
import { Recorder } from '@timecat/recorder'
import { Player } from '@timecat/player'

// from cdn
const { Recorder, Player } = window.TimeCat
```

#### Record

```ts
const recorder = new Recorder()
```
#### Play

```ts
const player = new Player()
```

## Advanced

#### Record Options
```ts
// record page
interface RecordOptions {
    mode: 'default' | 'live' // mode
    write: boolean // write data to indexedDB, default is true
    keep: boolean // keep data in DB otherwise auto-clear, default is true
    audio: boolean // if your want record audio, default is false
    font: boolean // record font, default is false
    plugins: RecorderPlugin[] // extend plugins here
    rewriteResource: RewriteResource
}

// make 'http://a.com/path' => 'http://b.com/path' for keep resource
interface RewriteResource {
    matches: string[] // example: ['css', 'woff']
    replaceOrigin: string  // example: 'https://xxx.com'
    folderPath?: string // /path/xxx
    fn?: (pre: string, next: string) => void
}

// default use IndexedDB to save records
const recorder = new Recorder(Partial<RecordOptions>)

// receive data here
recorder.onData((data: RecordData) => void)

// stop record
recorder.destroy()

// clear all records in db
recorder.clearDB()

// write a plugin 
class ExamplePlugin {
    constructor(options) { /** init plugin options */ }

    apply(recorder) {
        const { plugin, db } = recorder

        type HooksType = 'beforeRun' | 'run' | 'emit' | 'end'
        plugin(HooksType, () => void)
        plugin('emit', record => {
            // get record
            console.log(record)
            // you can modify record here
            record['some property'] = doSomething
        })

        // read or write to indexedDB
        const records = await db.readRecords()
        db.deleteRecords(range: { lowerBound: <recordID>, upperBound: <recordID> })
        db.clear()
        db.doSomething()...
    }
}

new Recorder({ plugins: [new ExamplePlugin(options...)] })

```
- [Record Example](https://github.com/oct16/TimeCat/blob/master/examples/todo.html#L257-L275) 

#### Replay

```ts
// replay record
interface ReplayOptions {
    target: string | HTMLElement // which element has contained the Player, default is Body
    records: RecordData[] // play with records data
    // receive data in live mode, see examples/mirror
    receiver: ((data: RecordData) => void) => void
    autoplay: boolean // autoplay when data loaded
    heatPoints: boolean // show heatPoints in progress bar, default is false
    timeMod: 'recordingTime' | 'durationTime' // default is durationTime
    fastForward: number[] // present the fast-forward speeds in progress bar, default is [4,16]
}

const player = new Player(Partial<ReplayOptions>)

type EventTypes = 'play' | 'stop' | 'pause' | 'speed' | 'resize'

player.on(eventType: EventTypes, (...args) => {
    // receive event here
})

player.destroy() // destroy player

```
- [Replay example](https://github.com/oct16/TimeCat/blob/master/examples/replay.html#L1-L29)


#### Export
```ts

import { exportReplay } from 'timecatjs'

// export html file
interface ExportOptions {
    scripts: ScriptItem[] // inject script in html
    autoplay: boolean // autoplay when data loaded
    audioExternal: boolean // export audio as a file, default is inline
    dataExternal: boolean // export data json as a file, default is inline
}

exportReplay(Partial<ExportOptions>)
```
- [Export Example](https://github.com/oct16/TimeCat/blob/5172352a6494c1182e83452605677796e0fe0f46/packages/player/src/keyboard.ts#L96-L154)


## Articles
 - [TimeCat 入门：我们的第一个应用](record-and-replay.md)
 - [TimeCat 进阶：把数据上传到服务器](upload-to-server.md)
 - TimeCat 高级 // TODO

---
##### [🏠Homepage](../README.md) 
