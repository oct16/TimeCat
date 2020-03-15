import { PointerComponent } from './pointer';
import { SnapshotData } from '@WebReplay/snapshot';
import { ProgressState } from '@WebReplay/utils';
import { ProgressComponent } from './progress';
export declare class PlayerComponent {
    data: SnapshotData[];
    speed: number;
    index: number;
    frameIndex: number;
    lastPercentage: number;
    frames: number[];
    requestID: number;
    startTime: number;
    pointer: PointerComponent;
    progress: ProgressComponent;
    progressState: ProgressState;
    constructor(data: SnapshotData[], pointer: PointerComponent, progress: ProgressComponent);
    play(speed: number): void;
    pause(): void;
    stop(): void;
    execFrame(this: PlayerComponent, snapshot: SnapshotData): void;
    getPercentInterval(): number;
    getAccuratelyFrame(interval?: number): number[];
}
