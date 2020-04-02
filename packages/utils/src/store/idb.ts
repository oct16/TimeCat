import { SnapshotData, WindowObserveData, DOMSnapshotData } from '@WebReplay/snapshot'

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
        request.onerror = e => {
            console.error('open indexedDB on error')
        }

        request.onsuccess = e => {
            this.db = request.result

            // this.clear()

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
            throw new Error('write indexedDB on error')
        }
    }

    clear() {
        const objectStore = this.db.transaction([`${this.storeName}`], 'readwrite').objectStore(`${this.storeName}`)
        objectStore.clear()
    }

    async readAll(): Promise<SnapshotData[]> {
        const objectStore = this.db.transaction([`${this.storeName}`], 'readwrite').objectStore(`${this.storeName}`)
        return new Promise(resolve => {
            objectStore.getAll().onsuccess = event => {
                const result = event!.target!.result as SnapshotData[]
                resolve(result)
            }
        })
    }

    async getData() {
        const all = await this.readAll()

        const [window, virtualNode, ...data] = all
        const [WindowData, { vNode }] = [window.data, virtualNode.data] as [
            WindowObserveData,
            DOMSnapshotData
        ]

        return {
            ...WindowData,
            vNode,
            data
        }
    }
}

export const DBPromise: Promise<IndexedDBOperator> = new Promise(resolve => {
    const indexedDB = new IndexedDBOperator('wr_db', 1, 'wr_data', () => {
        resolve(indexedDB)
    })
})
