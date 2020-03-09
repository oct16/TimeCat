export class EventBus {
    eventTopics: { [key: string]: Function[] } = {}

    listen(event: string, listener: Function) {

        if (!this.eventTopics[event] || this.eventTopics[event].length < 1) {
            this.eventTopics[event] = []
        }
        this.eventTopics[event].push(listener)
        console.log(this.eventTopics[event])

    }

    emit(event: string, params?: any) {

        
        if (!this.eventTopics[event] || this.eventTopics[event].length < 1) {
            return
        }

        console.log(event)

        this.eventTopics[event].forEach(listener => {
            listener(!!params ? params : {})
        })
    }

    remove(event: string) {
        if (!this.eventTopics[event] || this.eventTopics[event].length < 1) {
            return
        }
        // delete listener by event name
        delete this.eventTopics[event]
    }

    getListener(event: string) {
        return this.eventTopics[event]
    }
}
