import { SnapshotData } from '@WebReplay/snapshot';
export declare class IndexDBOperator {
    db: IDBDatabase;
    DBName: string;
    version: number;
    storeName: string;
    constructor(DBName: string, version: number, storeName: string, callback: (db: IDBDatabase) => void);
    add(data: SnapshotData): void;
    clear(): void;
    readAll(): Promise<SnapshotData[]>;
    getData(): Promise<{
        width: number;
        height: number;
        vNode: import("../../../virtual-dom/src").VNode;
        data: SnapshotData[];
    }>;
}
export declare const DBPromise: Promise<IndexDBOperator>;
