import { PlayerTypes } from './reducers/player'
import { ProgressTypes } from './reducers/progress'
import isEqual from 'lodash-es/isEqual'

export type State = { [key: string]: any }

export function createStore(reducer: (state: State, action: any) => State, initState: State = {}) {
    let state = initState

    const topics = {
        all: []
    } as { [key: string]: Function[] }

    function subscribe(type: string, listener: (state: State) => void): void
    function subscribe(listener: (state: State) => void): void

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

    function dispatch(action?: { type: string; data?: any }) {
        const oldState = state
        state = reducer(state, action)

        if (!action) {
            // dispatch all
            if (topics['all']) {
                topics['all'].forEach(listener => listener(state))
            }
            return
        }

        const topicName = getTypeInTopics(action.type)
        if (topicName && topics[topicName]) {
            return topics[topicName].forEach(listener => {
                if (!isEqual(state[topicName], oldState[topicName])) {
                    listener(state[topicName])
                }
            })
        }
    }

    function getState() {
        return state
    }

    function getTypeInTopics(type: string) {
        const topics = {
            player: Object.keys(PlayerTypes),
            progress: Object.keys(ProgressTypes)
        } as { [key: string]: string[] }

        for (let [key, enums] of Object.entries(topics)) {
            if (enums.includes(type)) {
                return key
            }
        }
        return null
    }

    return {
        subscribe,
        dispatch,
        getState
    }
}
