import { record } from '@WebReplay/record'
import { replay } from '@WebReplay/player'

const records: any[] = []

record({
    // emitter: e => console.log(JSON.stringify(e, null, 2))
    emitter: e => records.push(e)
})

const replayButton = document.getElementById('replay')
if (replayButton) {
    replayButton.onclick = function() {
        replay(records)
    }
}
