import Executor from "#helpers/executor_handler";

export default class ExecutorManager {
    private static instance: ExecutorManager
    private executors: Map<string, Executor> = new Map();

    constructor() {
        if (!ExecutorManager.instance) {
            this.executors = new Map()
            ExecutorManager.instance = this
        }
        return ExecutorManager.instance
    }

    public async getExecutorForUser(userId: number, conversation_id: number, modelName?: string) {
        const exec_id = (userId.toString() + "-" + conversation_id.toString())
        if (!this.executors.has(exec_id)) {
            this.executors.set(exec_id, new Executor())
            await this.executors.get(exec_id)?.setExecutorId(exec_id)
            if (modelName === undefined) {
                modelName = await this.executors.get(exec_id)?.getModel()
            }
            await this.executors.get(exec_id)?.setModel({ modelName: modelName || "gpt-4o-mini" })
            await this.executors.get(exec_id)?.initExecutor()
        }
        return this.executors.get(exec_id)
    }
}
