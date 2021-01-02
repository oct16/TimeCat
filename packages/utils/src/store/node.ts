/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class NodeStore {
    private static nodeId = 1
    private nodeMap: Map<number, Node>
    private idMap: WeakMap<Node, number>

    constructor() {
        this.init()
    }

    private init() {
        this.nodeMap = new Map()
        this.idMap = new WeakMap()
    }

    public reset() {
        this.nodeMap.clear()
    }

    public createNodeId = () => NodeStore.nodeId++

    public getNode(id: number) {
        return this.nodeMap.get(id) || null
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

    public updateNode(id: number, node: Node) {
        this.idMap.set(node, id)
        this.nodeMap.set(id, node)
    }
}

export const nodeStore = new NodeStore()
