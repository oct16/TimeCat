export declare class KeyboardComponent {
    container: HTMLElement;
    controller: HTMLElement;
    pauseBtn: HTMLElement;
    playBtn: HTMLElement;
    speed: number;
    constructor(container: HTMLElement);
    init(): void;
    paly(speed: number): void;
    setSpeed(speed: number): void;
}
