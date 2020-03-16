/// <reference types="lodash/common/common" />
/// <reference types="lodash/common/array" />
/// <reference types="lodash/common/collection" />
/// <reference types="lodash/common/date" />
/// <reference types="lodash/common/function" />
/// <reference types="lodash/common/lang" />
/// <reference types="lodash/common/math" />
/// <reference types="lodash/common/number" />
/// <reference types="lodash/common/object" />
/// <reference types="lodash/common/seq" />
/// <reference types="lodash/common/string" />
/// <reference types="lodash/common/util" />
import { ProgressState } from '@WebReplay/utils';
import { ContainerComponent } from './container';
export declare class ProgressComponent {
    progress: HTMLElement;
    thumb: HTMLElement;
    timer: HTMLElement;
    slider: HTMLElement;
    speed: number;
    rafId: number;
    progressState: ProgressState;
    totalDistance: number;
    throttleTimer: ((percentage: any) => void) & import("lodash").Cancelable;
    constructor(c: ContainerComponent);
    updateProgress(percentage: number): void;
    updateTimer(second: number): void;
    setThumb(percentage: number): void;
    resetThumb(): void;
}
