import { ProgressState } from '@WebReplay/utils';
import { ContainerComponent } from './container';
export declare class ProgressComponent {
    progress: HTMLElement;
    thumb: HTMLElement;
    slider: HTMLElement;
    speed: number;
    rafId: number;
    progressState: ProgressState;
    totalDistance: number;
    constructor(c: ContainerComponent);
    updateProgress(percentage: number): void;
}
