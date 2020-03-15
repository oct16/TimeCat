import { State } from '../create-store';
declare const initState: {
    frame: number;
    length: number;
    curTime: number;
    startTime: number;
    endTime: number;
};
export declare type ProgressState = typeof initState;
export declare enum ProgressTypes {
    FORWARD = "FORWARD",
    BACKWARD = "BACKWARD",
    INFO = "INFO"
}
export default function progressReducer(state: State, action?: any): any;
export {};
