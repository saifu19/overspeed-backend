import type { HttpContext } from '@adonisjs/core/http'
import Agent from '#models/agent'

export default class AgentsController {
    async createAgent({ request, response }: HttpContext) {
        const { name, systemPrompt, humanPrompt, isActive } = request.body()
        const agent = await Agent.create({ name, system_prompt: systemPrompt, human_prompt: humanPrompt, is_active: isActive })
        return response.json(agent)
    }

    async getAgents({ response }: HttpContext) {
        const agents = await Agent.all()
        return response.json(agents)
    }

    async getAgent({ params, response }: HttpContext) {
        const agent = await Agent.find(params.id)
        if (!agent) {
            return response.status(404).json({ message: 'Agent not found' })
        }
        return response.json(agent)
    }

    async updateAgent({ params, request, response }: HttpContext) {
        const { name, systemPrompt, humanPrompt, isActive } = request.body()
        const agent = await Agent.find(params.id)
        if (!agent) {
            return response.status(404).json({ message: 'Agent not found' })
        }
        agent.name = name
        agent.system_prompt = systemPrompt
        agent.human_prompt = humanPrompt
        agent.is_active = isActive
        await agent.save()
        return response.json(agent)
    }

    async deleteAgent({ params, response }: HttpContext) {
        const agent = await Agent.find(params.id)
        if (!agent) {
            return response.status(404).json({ message: 'Agent not found' })
        }
        await agent.delete()
        return response.json({ message: 'Agent deleted' })
    }
    async toggleAgent({ params, request, response }: HttpContext) {
        const { isActive } = request.body()
        const agent = await Agent.find(params.id)
        if (!agent) {
            return response.status(404).json({ message: 'Agent not found' })
        }
        agent.is_active = isActive
        await agent.save()
        return response.json(agent)
    }
}