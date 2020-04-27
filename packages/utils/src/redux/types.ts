export type Action = { type: string; data: State }
export type Reducer = (state: State, action?: Action) => State
export type State = { [key: string]: any }
