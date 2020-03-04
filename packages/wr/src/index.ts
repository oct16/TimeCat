import { record } from '@WebReplay/record'

const records: any[] = []

record({
    // emitter: e => console.log(JSON.stringify(e, null, 2))
    emitter: e => records.push(e)
})
