import Executor from "#helpers/executor_handler";

export default class ExecutorManager {
    executors: Map<string, Executor>;
    constructor() {
        this.executors = new Map();
    }

    public async getExecutorForUser(userId: string, conversation_id: number, session: any, modelName?: string) {
        
        if (session.has('subdomain') && session.has('subdomain_name')) {
            userId = userId + "-" + session.get('subdomain') + "-" + session.get('subdomain_name');
        }
        const exec_id = (userId + "-" + conversation_id).toString();
        if (!this.executors.has(exec_id)) {
            this.executors.set(exec_id, new Executor());
            await this.executors.get(exec_id)?.setExecutorId(exec_id);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (modelName === undefined) {
                modelName = await this.executors.get(exec_id)?.getModel();
            }
            await this.executors.get(exec_id)?.setModel({ modelName });
            await this.executors.get(exec_id)?.initExecutor();
        }

        return this.executors.get(exec_id);
        
    }

}
