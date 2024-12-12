import Conversation from '#models/conversation'
import Tool from '#models/tool'
import Message from '#models/message'
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

    async createConversation({ auth, response }: HttpContext) {
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.create({
            user_id: user.id
        })

        return response.json({ conversation })
    }

    async prepareConversation({ auth, params, response }: HttpContext) {
        const conversationId = params.conversationId
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

        const messages = await Message.query().where('conversation_id', conversation.id)
        if (messages.length > 0) {
            let input = ""
            let output = ""
            for (const message of messages) {
                if (message.sender === 'user') {
                    input += message.content
                } else {
                    output += message.content
                }
            }

            if (input !== "" && output !== "") {
                await executor.updateMemory({ input, output })
                await executor.initExecutor()
                input = ""
                output = ""
            }
        }

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
    
    async getConversations({ auth, response }: HttpContext) {
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }
        const conversations = await Conversation.query().where('user_id', user.id)
        return response.json({ conversations })
    }

    async createAndPrepareConversation({ response, auth }: HttpContext) {
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        try {
            const conversation = await Conversation.create({
                user_id: user.id
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
