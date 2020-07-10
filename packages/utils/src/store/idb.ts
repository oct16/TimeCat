import { SnapshotData, TransactionMode, RecordData } from '@timecat/share'

export class IndexedDBOperator {
    db: IDBDatabase
    DBName: string
    version: number
    storeName: string

    constructor(DBName: string, version: number, storeName: string, callback: (db: IDBDatabase) => void) {
        this.DBName = DBName
        this.version = version
        this.storeName = storeName

        const request = window.indexedDB.open(DBName, version)
        request.onerror = () => {
            console.error('open indexedDB on error')
        }

        request.onsuccess = () => {
            this.db = request.result
            callback(this.db)
        }

        request.onupgradeneeded = e => {
            const db = e.target!.result

            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, { autoIncrement: true, keyPath: 'id' })
                objectStore.createIndex('type', 'type', { unique: false })
                objectStore.createIndex('data', 'data', { unique: false })
                objectStore.createIndex('time', 'time', { unique: false })
            }
        }
    }

    private withIDBStore(type: IDBTransactionMode): Promise<IDBObjectStore> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, type)
            transaction.oncomplete = () => {}
            transaction.onabort = transaction.onerror = () => {
                reject(transaction.error)
                throw new Error('process indexedDB on error')
            }
            resolve(transaction.objectStore(this.storeName))
        })
    }

    private getStore() {
        return this.withIDBStore(TransactionMode.READWRITE)
    }

    async add(data: SnapshotData | RecordData) {
        const store = await this.getStore()
        store.add(data)
    }

    async clear() {
        const store = await this.getStore()
        store.clear()
    }

    async readAllRecords(): Promise<(SnapshotData | RecordData)[] | null> {
        const store = await this.getStore()

        const records: (SnapshotData | RecordData)[] = []
        // This would be store.getAll(), but it isn't supported by IE now.
        return new Promise(resolve => {
            store.openCursor().onsuccess = event => {
                const cursor = event!.target!.result

                if (cursor) {
                    records.push(cursor.value)
                    cursor.continue()
                    return
                }
                resolve(records)
            }
        }).then((arr: (SnapshotData | RecordData)[]) => (arr.length ? arr : null))
    }

    async count(): Promise<number> {
        const store = await this.getStore()

        return new Promise(resolve => {
            store.count().onsuccess = event => {
                const count = event!.target!.result
                resolve(count)
            }
        })
    }
}

export const getDBOperator: Promise<IndexedDBOperator> = new Promise(resolve => {
    const DBOperator = new IndexedDBOperator('cat_db', 1, 'cat_data', () => {
        resolve(DBOperator)
    })
})
