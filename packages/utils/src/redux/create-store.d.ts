export declare type State = {
    [key: string]: any;
};
export declare function createStore(reducer: (state: State, action: any) => State, initState?: State): {
    subscribe: {
        (type: string, listener: (state: State) => void): void;
        (listener: (state: State) => void): void;
    };
    dispatch: (action?: {
        type: string;
        data?: any;
    } | undefined) => void;
    getState: () => State;
};
