import { VNode } from './types';
export declare const createElement: (el: Element, inheritSVG?: boolean | undefined) => VNode | null;
export declare const virtualDOM: {
    createElement: (el: Element, inheritSVG?: boolean | undefined) => VNode | null;
    convertHTML: (doc: Document) => {
        id: number;
        tag: string;
        attrs: {};
        children: (VNode | null)[];
        extra: {
            isSVG: boolean;
        };
    };
};
