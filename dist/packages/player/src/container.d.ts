import { VNode } from '@WebReplay/virtual-dom';
export declare class ContainerComponent {
    container: HTMLElement;
    sandBox: HTMLIFrameElement;
    sandBoxDoc: Document;
    vNode: VNode;
    width: number;
    height: number;
    constructor(params: {
        vNode: VNode;
        width: number;
        height: number;
    });
    init(): void;
    initSandbox(): void;
    setViewState(): void;
    initTemplate(): void;
    createContainer(): HTMLElement;
    createStyle(s: string): HTMLElement;
}
