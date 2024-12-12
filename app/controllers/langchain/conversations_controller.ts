import Conversation from '#models/conversation'
import Tool from '#models/tool'
import ExecutorManager from '#providers/executor_provider/index'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ToolsHelper from '#helpers/tools_helper'

@inject()
export default class ConversationsController {
    protected toolsHelper: ToolsHelper
    constructor(protected executorManager: ExecutorManager) {
        this.toolsHelper = new ToolsHelper()
    }

    async createConversation({ auth, request, response }: HttpContext) {
        const project = request.body().project_id
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.create({
            user_id: user.id,
            project_id: project
        })

        return response.json({ conversation })
    }

    async prepareConversation({ auth, request, response }: HttpContext) {
        const { conversationId } = request.only(['conversationId'])
        const user = auth.user

        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.find(conversationId)

        if (!conversation) {
            return response.status(404).json({ error: 'Conversation not found' })
        }
        
        const tools = await this.addToolsToConversation(user.id, conversation.id, this.executorManager)

        const executor = await this.executorManager.getExecutorForUser(user.id, conversation.id)

        if (!executor) {
            return response.status(500).json({ error: 'Failed to initialize executor' })
        }

        const prompt = "You are a helpful assistant."

        await executor.setPrompt(prompt)
        await executor.initExecutor()

        return response.json({ conversation, tools })
    }

    // Helper function to add tools to a conversation
    async addToolsToConversation(userId: number, conversationId: number, executorManager: ExecutorManager) {
        const tools = await Tool.query().where('is_active', true)
        for (const tool of tools) {
            await this.toolsHelper.toggleTool({ toggleStatus: 'on', toolId: tool.id, userId: userId, conversationId: conversationId, executorManager: executorManager })
        }
        return tools
    }
    
    async getConversations({ auth, response, params }: HttpContext) {
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }
        const projectId = params.projectId
        const conversations = await Conversation.query().where('user_id', user.id).where('project_id', projectId)
        return response.json({ conversations })
    }

    async createAndPrepareConversation({ request, response, auth }: HttpContext) {
        const project = request.body().projectId
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        try {
            const conversation = await Conversation.create({
                user_id: user.id,
                project_id: project
            })

            const executor = await this.executorManager.getExecutorForUser(user.id, conversation.id)

            if (!executor) {
                return response.status(500).json({ error: 'Failed to initialize executor' })
            }

            const tools = await this.addToolsToConversation(user.id, conversation.id, this.executorManager)

            const prompt = "You are a helpful assistant."

            await executor.setPrompt(prompt)
            await executor.initExecutor()

            return response.status(200).json({ conversation, tools })
        } catch (error) {
            return response.status(500).json({ error: 'Failed to create and prepare conversation' })
        }
    }
}
