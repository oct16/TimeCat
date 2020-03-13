import { record } from '@WebReplay/record'
import { replay } from '@WebReplay/player'
import { DBPromise, nodeStore } from '@WebReplay/utils'

async function start() {
    const indexDB = await DBPromise

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
