import ExecutorManager from "#providers/executor_provider/index"

declare module '@adonisjs/core/types' {
    interface ContainerBindings {
        'langchain/manager': ExecutorManager
    }
}

export {}