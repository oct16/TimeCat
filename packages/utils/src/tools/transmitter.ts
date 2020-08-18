import { IndexedDBOperator, getDBOperator } from '../store/idb'
import { RecordData, DBRecordData } from '@timecat/share'
import { delay } from './common'

export class Transmitter {
    private db: IndexedDBOperator
    private uploadUrl: string
    constructor(uploadUrl: string) {
        this.uploadUrl = uploadUrl
        this.init()
    }

    private interval = 5000 // send data every 5s
    private bufferSize = 10

    private async init() {
        this.db = await getDBOperator

        this.uploadChunksHandle()
        this.db.listen('add', this.uploadChunksHandle.bind(this))
    }

    uploadChunksHandle = this.uploadChunks()

    uploadChunks() {
        let timer: number | null = null
        let checkNext = false
        const self = this

        return async () => {
            if (timer) {
                return
            }

            timer = window.setTimeout(clear, this.interval)

            function clear() {
                clearTimeout(timer as number)
                timer = 0

                if (checkNext) {
                    self.uploadChunksHandle()
                }
            }

            // waiting for watches ready
            await delay(1000)

            const records = (await this.db.readRecords({ limit: this.bufferSize })) as DBRecordData[]
            if (records) {
                if (await this.uploadToDB(records)) {
                    const range = { lowerBound: records[0].id, upperBound: records.slice(-1)[0].id }
                    this.db.deleteRecords(range)
                }
                checkNext = true
                return
            }
            checkNext = false
        }
    }

    async uploadToDB(records: RecordData[]): Promise<boolean> {
        return await fetch(this.uploadUrl, {
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(records)
        }).then(() => true)
    }
}
