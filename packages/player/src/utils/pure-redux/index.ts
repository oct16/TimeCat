import { Store } from '../redux'
import { State } from '../redux/types'
import { ValueOf } from '@timecat/share/src'

export type Props = Partial<ValueOf<State>>

const shallowEqual = (prevProps: Props, nextProps: Props) => {
    if (prevProps === nextProps) {
        return true
    }
    if (
        !(typeof prevProps === 'object' && prevProps != null) ||
        !(typeof nextProps === 'object' && nextProps != null)
    ) {
        return false
    }
    const keysA = Object.keys(prevProps) as [keyof Props]
    const keysB = Object.keys(nextProps) as [keyof Props]
    if (keysA.length !== keysB.length) {
        return false
    }
    for (let i = 0; i < keysA.length; i++) {
        if (nextProps.hasOwnProperty(keysA[i])) {
            if (prevProps[keysA[i]] !== nextProps[keysA[i]]) {
                return false
            }
        } else {
            return false
        }
    }
    return true
}

const provider = (store: typeof Store) => {
    return (mapStateToProps: (state: State) => Props) => {
        let props: Props
        return (render: (state: Props) => void) => {
            const getProps = () => mapStateToProps(store.getState())
            store.subscribe(() => {
                const newProps = getProps()
                if (shallowEqual(newProps, props)) {
                    return
                }
                render((props = newProps))
            })
        }
    }
}

export const connect = provider(Store)

export const ConnectProps = (mapStateToProps: (state: State) => Props | ValueOf<State>) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = function (cb?: Function) {
            connect(mapStateToProps)(state => {
                originalMethod.call(this, state)
                cb && cb(state)
            })
        }
    }
}
