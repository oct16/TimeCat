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
    write?: boolean // write data to indexedDB, default is true
    audio?: boolean // if your want record audio
}

// default use IndexedDB to save records
const recorder = new Recorder(RecordOptions)

// if you wanna send the records to server
const recorder = new recorder()

// receive data here
recorder.onData((data: RecordData) => void)

// The onData API called very frequently
// You can push the data to a Array
// Collect the amount of data and upload it

// simple upload like this
const records = []
recorder.onData((data) => {
    records.push(data)
})

// upload after collected
fetch(<Server URL>, {
        body: JSON.stringify(records),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
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
    // receive data in live mode
    receiver?: ((data: RecordData) => void) => void
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
