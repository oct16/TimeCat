import { PointerComponent } from './pointer';
import { SnapshotData } from '@WebReplay/snapshot';
import { ProgressState } from '@WebReplay/utils';
import { ProgressComponent } from './progress';
import { ContainerComponent } from './container';
export declare class PlayerComponent {
    data: SnapshotData[];
    delayTime: number;
    speed: number;
    index: number;
    frameIndex: number;
    lastPercentage: number;
    frames: number[];
    requestID: number;
    startTime: number;
    c: ContainerComponent;
    pointer: PointerComponent;
    progress: ProgressComponent;
    progressState: ProgressState;
    constructor(data: SnapshotData[], c: ContainerComponent, pointer: PointerComponent, progress: ProgressComponent);
    play(): void;
    pause(): void;
    stop(): void;
    execFrame(this: PlayerComponent, snapshot: SnapshotData): void;
    getPercentInterval(): number;
    getAccuratelyFrame(interval?: number): number[];
}
