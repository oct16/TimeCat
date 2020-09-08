### Quick Start

> TimeCat is going rapid iteration, The API may change frequently, Please pay attention to documentation updates, If you have any questions, please contact the author

###### Import SDK
```ts
// from module
import { Recorder, Player } from 'timecatjs';
 // or
import Recorder from '@timecat/recorder'
import Player from '@timecat/player'

// from cdn
const { Recorder, Player } = window.TimeCat
```

###### Record Data
```ts
// record page
interface RecordOptions {
    mode?: 'live' | 'default' // mode
    context?: Window  // record context
    audio?: boolean // if your want record audio
    uploadUrl?: string // will post PackData to server
    // callback data here
    onData?: (data: RecordData, db: IndexedDBOperator) => RecordData | void
}

// default use IndexedDB to save records
const recorder = new Recorder(RecordOptions)

// if you wanna send the records to server
const recorder = new recorder({
    uploadUrl: <Server URL>
    // or custom
    onData: (data, db) => fetch(<Server URL>, {
            body: JSON.stringify(data),
            method: 'POST',
            ContentType: 'application/json'
        })
})

// if you want stop record
recorder.unsubscribe()
```
- [Record Example](https://github.com/oct16/TimeCat/blob/073c467afc644ce37e4f51937c28eb5000b2a92c/examples/todo.html#L258) 

###### Replay

```ts
// replay record
interface ReplayOptions {
    mode?: 'live' | 'default' // mode
    records: ReplayData[]
    packs?: ReplayPack[] // data from options
    fetch?: { url: string; options?: RequestInit } // data from server
    // receive data in live mode
    receiver?: (sender: (data: RecordData) => void) => void
    proxy?: string // if cross domain
    autoplay?: boolean // autoplay when data loaded
}

new Player(ReplayOptions)
```
- [Replay example](https://github.com/oct16/TimeCat/blob/4c91fe2e9dc3786921cd23288e26b421f6ea0848/examples/player.html#L14)


###### Export
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

##### [🏠Homepage](../README.md) 
