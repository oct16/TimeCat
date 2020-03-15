import { State } from '../create-store';
export declare enum PlayerTypes {
    SPEED = "SPEED"
}
export declare type PlayerState = typeof PlayerTypes;
export default function playerReducer(state: State, action: any): any;
