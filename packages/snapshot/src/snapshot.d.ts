import { WindowObserve, DOMSnapshot, SnapshotEvent, MouseSnapshot, DOMObserve, FormElementObserve } from './types';
declare function windowObserve(emit: SnapshotEvent<WindowObserve>): void;
declare function DOMSnapshot(emit: SnapshotEvent<DOMSnapshot>): void;
declare function mouseObserve(emit: SnapshotEvent<MouseSnapshot>): void;
declare function DOMObserve(emit: SnapshotEvent<DOMObserve>): void;
declare function formElementObserve(emit: SnapshotEvent<FormElementObserve>): void;
export declare const snapshots: {
    windowObserve: typeof windowObserve;
    DOMSnapshot: typeof DOMSnapshot;
    mouseObserve: typeof mouseObserve;
    DOMObserve: typeof DOMObserve;
    formElementObserve: typeof formElementObserve;
};
export {};
