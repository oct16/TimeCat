import { State } from './create-store';
export declare type Action = {
    type: string;
    state: State;
};
export declare type Reducer = (state: State, action?: Action) => State;
export declare function combineReducers(reducers: {
    [key: string]: Reducer;
}): (state: State, action?: Action | undefined) => State;
