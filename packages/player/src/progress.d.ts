import { ProgressState } from '@WebReplay/utils';
export declare class ProgressComponent {
    progress: HTMLElement;
    thumb: HTMLElement;
    slider: HTMLElement;
    speed: number;
    rafId: number;
    progressState: ProgressState;
    totalDistance: number;
    constructor(c: HTMLElement);
    updateProgress(percentage: number): void;
}
