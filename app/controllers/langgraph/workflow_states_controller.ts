import type { HttpContext } from '@adonisjs/core/http'
import WorkflowState from '#models/workflow_state'

export default class WorkflowStatesController {
    async getStates({ params, response }: HttpContext) {
        const { workflowId } = params
        const states = await WorkflowState.query()
            .where('workflow_id', workflowId)
            .orderBy('created_at', 'asc')
        
        return response.json({ states })
    }

    async createState({ params, request, response }: HttpContext) {
        const { workflowId } = params
        const { content, agent_name, state_type } = request.body()
        
        const state = await WorkflowState.create({
            workflow_id: workflowId,
            content,
            agent_name,
            state_type
        })
        
        return response.json({ state })
    }
}