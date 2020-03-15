export declare class PointerComponent {
    x: number;
    y: number;
    pointer: HTMLElement;
    constructor();
    initPointer(): void;
    move(x: number, y: number): void;
    click(x: number, y: number): void;
}
