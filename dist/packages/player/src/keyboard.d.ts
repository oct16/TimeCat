import { ContainerComponent } from './container';
export declare class KeyboardComponent {
    c: ContainerComponent;
    controller: HTMLElement;
    pauseBtn: HTMLElement;
    playBtn: HTMLElement;
    speed: number;
    constructor(container: ContainerComponent);
    init(): void;
    paly(speed: number): void;
    setSpeed(speed: number): void;
}
