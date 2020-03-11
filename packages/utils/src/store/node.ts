class NodeStore {
    private nodeId = 1
    private nodeMap: Map<number, Node> = new Map()
    private idMap: WeakMap<Node, number> = new WeakMap()

    public createNodeId = () => this.nodeId++

    public getNode(id: number) {
        return this.nodeMap.get(id)
    }

    public addNode(node: Node, id: number = this.createNodeId()) {
        this.idMap.set(node, id)
        this.nodeMap.set(id, node)
        return id
    }

    public removeNode(id: number) {
        this.nodeMap.delete(id)
        this.idMap.delete(this.getNode(id) as Node)
    }

    public getNodeId(node: Node) {
        return this.idMap.get(node)
    }

    public getAllInputs() { // TODO IMPROVE
        return [...this.nodeMap.values()].filter((node: Element) =>
            ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName)
        )
    }

    public updateNode(id: number, node: Node) {
        this.idMap.set(node, id)
        this.nodeMap.set(id, node)
    }
}

export const nodeStore = new NodeStore()
