import { record } from '@WebReplay/record'

record({
    emitter: e => console.log(e)
})
