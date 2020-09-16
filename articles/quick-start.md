## Quick Start

> TimeCat is going rapid iteration, The API may change frequently, Please pay attention to documentation updates, If you have any questions, please contact the author

#### Import TimeCat
```ts
// from module
import { Recorder, Player } from 'timecatjs';
 // or
import Recorder from '@timecat/recorder'
import Player from '@timecat/player'

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
    mode?: 'live' | 'default' // mode
    write?: boolean // write data to indexedDB, default is true
    audio?: boolean // if your want record audio
    plugins?: RecorderPlugin[] // extend plugins here
}

// default use IndexedDB to save records
const recorder = new Recorder(RecordOptions)

// receive data here
recorder.onData((data: RecordData) => void)

// if you want stop record
recorder.destroy()

// write a plugin 
class EmitPlugin {
    apply(recorder) {
        recorder.plugin('emit', (data) => {
            // get dataRecord
            console.log(data)
            
            // you can modify data here
            data.insertNumber = Date.now()
            
            // operating database
            recorder.db.doSomething(...)
        })
    }
}
```
- [Record Example](https://github.com/oct16/TimeCat/blob/master/examples/todo.html#L257-L275) 

#### Replay

```ts
// replay record
interface ReplayOptions {
    mode?: 'live' | 'default' // mode
    records: RecordData[] // play with records data
    packs?: ReplayPack[] // play with packs data
    // receive data in live mode, see examples/mirror
    receiver?: ((data: RecordData) => void) => void
    autoplay?: boolean // autoplay when data loaded
}

const player = new Player(ReplayOptions)

type EventTypes = 'play' | 'stop' | 'pause' | 'speed'
player.on(eventType: EventTypes, (...args) => {
    // ... receive event here
})

player.destroy() // destroy player

```
- [Replay example](https://github.com/oct16/TimeCat/blob/master/examples/replay.html#L1-L29)


#### Export
```ts

import { exportReplay } from 'timecatjs'

// export html file
interface ExportOptions {
    scripts?: ScriptItem[] // inject script in html
    autoplay?: boolean // autoplay when data loaded
    audioExternal?: boolean // export audio as a file, default is inline
    dataExternal?: boolean // export data json as a file, default is inline
}

exportReplay(ExportOptions)
```
- [Export Example](https://github.com/oct16/TimeCat/blob/5172352a6494c1182e83452605677796e0fe0f46/packages/player/src/keyboard.ts#L96-L154)


## Articles
 - [TimeCat 入门：我们的第一个应用](record-and-replay.md)

---
##### [🏠Homepage](../README.md) 
