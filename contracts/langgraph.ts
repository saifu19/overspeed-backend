import GraphManager from "#providers/graph_provider/index"

declare module '@adonisjs/core/types' {
    interface ContainerBindings {
        'langgraph/manager': GraphManager
    }
}

export {}