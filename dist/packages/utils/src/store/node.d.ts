declare class NodeStore {
    private nodeId;
    private nodeMap;
    private idMap;
    createNodeId: () => number;
    getNode(id: number): Node | undefined;
    addNode(node: Node, id?: number): number;
    removeNode(id: number): void;
    getNodeId(node: Node): number | undefined;
    updateNode(id: number, node: Node): void;
}
export declare const nodeStore: NodeStore;
export {};
