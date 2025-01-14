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

    public async getGraphForUser(userId: string | number, workflowId: number) {
        let didExist = false
        const graphId = `${userId}-${workflowId}`
        
        if (!this.graphs.has(graphId)) {
            const handler = new GraphHandler()
            handler.setGraphId(graphId)
            this.graphs.set(graphId, handler)
        } else {
            didExist = true
        }
        
        const graph = this.graphs.get(graphId)
        if (!graph) {
            throw new Error(`Failed to initialize graph for user ${userId} and workflow ${workflowId}`)
        }
        
        return { graph, didExist }
    }
}
