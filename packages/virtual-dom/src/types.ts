export interface VNode {
    attrs: { [key: string]: string }
    children: (VNode | string)[]
    tag: string
    id: number
    extra: {
        props?: { [key: string]: any }
        isSVG?: boolean
    }
}
