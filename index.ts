import { record } from '@WebReplay/record'
import { replay } from '@WebReplay/player'
import { DataStore, SnapshotData } from '@WebReplay/snapshot'

new Promise(resolve => {
    const indexDB = new DataStore('wr_db', 1, 'wr_data', () => {
        resolve(indexDB)
    })
}).then((indexDB: DataStore) => {
    record({
        emitter: data => {
            indexDB.add(data)
        }
    })
    const replayButton = document.getElementById('replay')
    if (replayButton) {
        replayButton.onclick = () => {
            indexDB.readAll((data: SnapshotData[]) => {
                replay(data)
            })
        }
    }
})
