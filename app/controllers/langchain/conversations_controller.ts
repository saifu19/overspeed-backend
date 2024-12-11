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
        this.toolsHelper = new ToolsHelper(this.executorManager)
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

    async prepareConversation({ auth, request, response, session }: HttpContext) {
        const { conversationId } = request.only(['conversationId'])
        const user = auth.user

        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.find(conversationId)

        if (!conversation) {
            return response.status(404).json({ error: 'Conversation not found' })
        }
        const tools = await Tool.query().where('is_active', true)
        for (const tool of tools) {
            await this.toolsHelper.toggleTool({ toggleStatus: 'on', session: session, toolId: tool.id, userId: user.id, conversationId: conversation.id })
        }

        const executor = await this.executorManager.getExecutorForUser(user.id, conversation.id)

        if (!executor) {
            return response.status(500).json({ error: 'Failed to initialize executor' })
        }

        const prompt = "You are a helpful assistant."

        await executor.setPrompt(prompt)
        await executor.initExecutor()

        return response.json({ conversation, tools })
    }
}