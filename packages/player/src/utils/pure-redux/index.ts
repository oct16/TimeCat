import { reduxStore } from '../redux'
import { StateMap } from '../redux/types'

type Props = { [key: string]: any } & Partial<StateMap>

export const provider = (store: typeof reduxStore) => {
    return (mapStateToProps: (state: StateMap) => Props) => {
        return (render: (state: Props) => void) => {
            // const renderWrapper = () => {
            const props = mapStateToProps(store.getState())
            render(props)

            store.subscribe(render)

            // }
            // return renderWrapper
        }
    }
}

export const connect = provider(reduxStore)
