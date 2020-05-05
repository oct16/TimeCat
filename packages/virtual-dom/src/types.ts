type Attrs = { [key: string]: string }

type Extra = {
    props?: { [key: string]: string | number | boolean }
    isSVG?: boolean
}

type Children = (VNode | VSNode)[]

export interface VSNode {
    id: number
    type: number
    value: string
}

export interface VNode {
    type: number
    id: number
    tag: string
    attrs: Attrs
    children: Children
    extra: Extra
}
