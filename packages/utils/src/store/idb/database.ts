/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { logError } from '@timecat/utils'
import { TimeCatModel } from './model'

export class Database {
    db: IDBDatabase | undefined
    DBName: string
    version: number
    storeName: string
    dbResolve: Promise<IDBDatabase> | undefined

    constructor(DBName: string, version: number, storeName: string) {
        this.DBName = DBName
        this.version = version
        this.storeName = storeName
        this.init()
    }

    private async init() {
        this.dbResolve = this.initDB()
        this.db = await this.dbResolve
    }

    private initDB(): Promise<IDBDatabase> {
        const request = window.indexedDB.open(this.DBName, this.version)

        request.onupgradeneeded = e => {
            const db = e.target!.result

            if (!db.objectStoreNames.contains(this.storeName)) {
                const objectStore = db.createObjectStore(this.storeName, { autoIncrement: true, keyPath: 'id' })
                TimeCatModel.forEach(args => objectStore.createIndex(...args))
            }
        }

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = () => {
                const msg = 'open indexedDB on error'
                logError(msg) && reject(msg)
            }
        })
    }

    protected getIDBObjectStore(type: IDBTransactionMode): Promise<IDBObjectStore> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, type)
            transaction.oncomplete = () => {}
            transaction.onabort = transaction.onerror = () => {
                const err = transaction.error
                logError(err) && reject(err)
            }
            resolve(transaction.objectStore(this.storeName))
        })
    }
}
