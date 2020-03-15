export { PlayerTypes, PlayerState } from './reducers/player';
export { ProgressTypes, ProgressState } from './reducers/progress';
export declare const reduxStore: {
    subscribe: {
        (type: string, listener: (state: import("./create-store").State) => void): void;
        (listener: (state: import("./create-store").State) => void): void;
    };
    dispatch: (action?: {
        type: string;
        data?: any;
    } | undefined) => void;
    getState: () => import("./create-store").State;
};
