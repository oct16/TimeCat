import { PlayerTypes } from './reducers/player'
import { ProgressTypes } from './reducers/progress'
import { objectEquals } from '../tools/tool'
import { States, Reducer, Action, TopicName, StateMap } from './types'
import { ValueOfKey } from '@timecat/share'

export function createStore(reducer: Reducer, initState: States = {}) {
    let state = initState

    const topics = {
        all: []
    } as { [key: string]: Function[] }

    function subscribe<T extends keyof StateMap, S extends ValueOfKey<StateMap, T>>(
        type: T,
        listener: (state: S) => void
    ): void
    function subscribe(listener: (state: StateMap) => void): void

    function subscribe(...args: any): void {
        let type = 'all'
        let listener
        if (typeof args[0] === 'string') {
            type = args[0]
            listener = args[1]
        } else {
            listener = args[0]
        }
        if (!topics[type]) {
            topics[type] = []
        }
        topics[type].push(listener)
    }

    function dispatch(action: Action) {
        const oldState = state
        state = reducer(state, action)

        if (!action) {
            // dispatch all
            if (topics['all']) {
                topics['all'].forEach(listener => listener(state))
            }
            return
        }

        const topicName = getTypeInTopics(action.type as TopicName)
        if (topicName && topics[topicName]) {
            return topics[topicName].forEach(listener => {
                if (!objectEquals(state[topicName], oldState[topicName])) {
                    listener(state[topicName])
                }
            })
        }
    }

    function getState(): StateMap

    function getState<T extends keyof StateMap>(name?: T): StateMap[T]
    
    function getState<T extends keyof StateMap>(name?: T) {
        const s = state as StateMap
        if (name) {
            return s[name] as StateMap[T]
        }
        return s 
    }

    function getTypeInTopics(type: TopicName): TopicName | undefined {
        const topics = {
            player: Object.keys(PlayerTypes),
            progress: Object.keys(ProgressTypes)
        }

        for (let [key, enums] of Object.entries(topics)) {
            if (enums.includes(type)) {
                return key as TopicName
            }
        }
    }

    return {
        subscribe,
        dispatch,
        getState
    }
}
