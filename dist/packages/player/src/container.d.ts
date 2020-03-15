import { VNode } from '@WebReplay/virtual-dom';
export declare class Container {
    container: HTMLElement;
    sandBox: HTMLIFrameElement;
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
    initTemplate(): void;
    createContainer(): HTMLElement;
    createStyle(): HTMLElement;
}
