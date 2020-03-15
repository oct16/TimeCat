import { KeyboardComponent } from './keyboard';
import { PlayerComponent } from './player';
import { PointerComponent } from './pointer';
import { SnapshotData } from '@WebReplay/snapshot';
import { ProgressComponent } from './progress';
import { ContainerComponent } from './container';
export declare class Panel {
    data: SnapshotData[];
    keyboard: KeyboardComponent;
    progress: ProgressComponent;
    pointer: PointerComponent;
    player: PlayerComponent;
    container: ContainerComponent;
    constructor(container: ContainerComponent, data: SnapshotData[]);
    initComponent(): void;
}
