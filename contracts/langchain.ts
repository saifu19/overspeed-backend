declare module '@adonisjs/core/types' {
    interface ContainerBindings {
        'langchain/manager': ExecutorManager
    }
}

export interface ExecutorManager {
    getExecutorForUser(
        userId: string,
        conversation_id: number,
        session: any,
        modelName?: string
    ): Promise<any>
} 