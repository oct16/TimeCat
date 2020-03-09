import { record } from '@WebReplay/record'
import { replay } from '@WebReplay/player'
import { dbPromise } from '@WebReplay/snapshot'

async function start() {
    const indexDB = await dbPromise

    record({
        emitter: data => {
            indexDB.add(data)
        }
    })

    const replayButton = document.getElementById('replay')
    if (replayButton) {
        replayButton.onclick = () => {
            replay()
        }
    }
}

start()
