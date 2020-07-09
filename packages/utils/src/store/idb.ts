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

    private withIDBStore(type: IDBTransactionMode, callback: (store: IDBObjectStore) => void): Promise<void>{
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, type)
            transaction.oncomplete = () => resolve()
            transaction.onabort = transaction.onerror = () => reject(transaction.error)
            callback(transaction.objectStore(this.storeName))
        })
    }

    add(data: SnapshotData | RecordData) {
        this.withIDBStore(TransactionMode.READWRITE, store => {
            store.add(data)
        }).catch(() => {
            throw new Error('write indexedDB on error')
        })
    }

    clear() {
        this.withIDBStore(TransactionMode.READWRITE, store => {
            store.clear()
        })
    }

    async readAllRecords(): Promise<(SnapshotData | RecordData)[]> {
        const records: (SnapshotData | RecordData)[]= []
        return this.withIDBStore(TransactionMode.READONLY, store => {
            // This would be store.getAll(), but it isn't supported by IE now.
            store.openCursor().onsuccess = event => {
                const cursor = event!.target!.result

                if (cursor) {
                    records.push(cursor.value)
                    cursor.continue()
                }
            }
        }).then(() => records)
    }
}

export const getDBOperator: Promise<IndexedDBOperator> = new Promise(resolve => {
    const DBOperator = new IndexedDBOperator('cat_db', 1, 'cat_data', () => {
        resolve(DBOperator)
    })
})
