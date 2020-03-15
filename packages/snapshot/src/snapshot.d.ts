import { WindowSnapshot, DOMSnapshot, SnapshotEvent, MouseSnapshot, DOMObserve, FormElementObserve } from './types';
declare function windowSnapshot(emit: SnapshotEvent<WindowSnapshot>): void;
declare function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>): void;
declare function mouseObserve(emit: SnapshotEvent<MouseSnapshot>): void;
declare function DOMObserve(emit: SnapshotEvent<DOMObserve>): void;
declare function formElementObserve(emit: SnapshotEvent<FormElementObserve>): void;
export declare const snapshots: {
    windowSnapshot: typeof windowSnapshot;
    DOMSnapshot: typeof DOMSnapshot;
    mouseObserve: typeof mouseObserve;
    DOMObserve: typeof DOMObserve;
    formElementObserve: typeof formElementObserve;
};
export {};
