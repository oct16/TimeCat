import { KeyboardComponent } from './keyboard';
import { PlayerComponent } from './player';
import { PointerComponent } from './pointer';
import { SnapshotData } from '@WebReplay/snapshot';
import { ProgressComponent } from './progress';
export declare class Panel {
    container: HTMLElement;
    data: SnapshotData[];
    keyboard: KeyboardComponent;
    progress: ProgressComponent;
    pointer: PointerComponent;
    player: PlayerComponent;
    constructor(container: HTMLElement, data: SnapshotData[]);
    initComponent(): void;
}
