import { SnapshotData } from '@WebReplay/snapshot'

export class IndexDBOperator {
    db: IDBDatabase
    DBName: string
    version: number
    storeName: string

    constructor(DBName: string, version: number, storeName: string, callback: (db: IDBDatabase) => void) {
        this.DBName = DBName
        this.version = version
        this.storeName = storeName

        const request = window.indexedDB.open(DBName, version)
        request.onerror = e => {
            console.error('open IndexDB on error')
        }

        request.onsuccess = e => {
            this.db = request.result

            this.clear()

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

    add(data: SnapshotData) {
        const request = this.db
            .transaction([`${this.storeName}`], 'readwrite')
            .objectStore(`${this.storeName}`)
            .add(data)

        request.onerror = e => {
            throw new Error('write IndexDB on error')
        }
    }

    clear() {
        const objectStore = this.db.transaction([`${this.storeName}`], 'readwrite').objectStore(`${this.storeName}`)
        objectStore.clear()
    }

    readAll = (callback: any) => {
        const objectStore = this.db.transaction([`${this.storeName}`], 'readwrite').objectStore(`${this.storeName}`)
        objectStore.getAll().onsuccess = event => {
            callback(event!.target!.result)
        }
    }
}

export const dbPromise: Promise<IndexDBOperator> = new Promise(resolve => {
    const indexDB = new IndexDBOperator('wr_db', 1, 'wr_data', () => {
        resolve(indexDB)
    })
})
