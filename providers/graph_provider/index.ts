import GraphHandler from "#helpers/graph_handler";

export default class GraphManager {
    private static instance: GraphManager
    private graphs: Map<string, GraphHandler> = new Map();

    constructor() {
        if (!GraphManager.instance) {
            this.graphs = new Map()
            GraphManager.instance = this
        }
        return GraphManager.instance
    }

    public async getGraphForUser(userId: number, conversation_id: number) {
        let didExist = false
        const graphId = (userId.toString() + "-" + conversation_id.toString())
        if (!this.graphs.has(graphId)) {
            this.graphs.set(graphId, new GraphHandler())
            this.graphs.get(graphId)?.setGraphId(graphId)
        } else {
            didExist = true
        }
        return { graph: this.graphs.get(graphId), didExist }
    }
}
