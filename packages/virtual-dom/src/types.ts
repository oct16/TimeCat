export interface VNode {
    attrs: { [key: string]: string }
    type: number
    children: (VNode | VSNode)[]
    tag: string
    id: number
    extra: {
        props?: { [key: string]: any }
        isSVG?: boolean
    }
}

export interface VSNode {
    id: number
    type: number
    value: string
}
