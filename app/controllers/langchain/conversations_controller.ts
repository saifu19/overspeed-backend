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

    async createConversation(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.create({
            user_id: ctx.user.id
        })

        return response.json({ conversation })
    }

    async prepareConversation(ctx: HttpContext) {
        const { params, response } = ctx
        const conversationId = params.conversationId

        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.query()
            .where('id', conversationId)
            .where('user_id', ctx.user.id)
            .first()

        if (!conversation) {
            return response.status(404).json({ error: 'Conversation not found' })
        }

        await this.addToolsToConversation(ctx.user.id, conversation.id)

        return response.json({ conversation })
    }

    private async addToolsToConversation(userId: string, conversationId: number) {
        const tools = await Tool.query().where('is_active', true)
        for (const tool of tools) {
            await this.toolsHelper.toggleTool({
                toggleStatus: 'on',
                toolId: tool.id,
                userId,
                conversationId: conversationId,
                executorManager: this.executorManager
            })
        }
    }

    async getConversations(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversations = await Conversation.query()
            .where('user_id', ctx.user.id)
            .orderBy('created_at', 'desc')

        return response.json({ conversations })
    }

    async createAndPrepareConversation(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        try {
            const conversation = await Conversation.create({
                user_id: ctx.user.id
            })

            const executor = await this.executorManager.getExecutorForUser(ctx.user.id, conversation.id)

            if (!executor) {
                return response.status(500).json({ error: 'Failed to initialize executor' })
            }
            await this.addToolsToConversation(ctx.user.id, conversation.id)
            return response.json({ conversation })
        } catch (error) {
            console.error('Error creating and preparing conversation:', error)
            return response.status(500).json({ error: 'Failed to create and prepare conversation' })
        }
    }
}
