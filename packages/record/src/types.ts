export interface RecordOptions {
    emitter?: (e: RecordEvent) => void
}

export interface RecordEvent {
    type: any
    data: any
}
