import type { HttpContext } from '@adonisjs/core/http'
import ExecutorManager from '#providers/executor_provider/index'
import { inject } from '@adonisjs/core'
import Ws from '#services/ws';
import Message from '#models/message';
import { sleep } from '#helpers/utils';

@inject()
export default class MessagesController {

    constructor(protected executorManager: ExecutorManager) {}

    async sendMessage({ auth, request, response, session }: HttpContext) {
        const { message, conversation_id } = request.only(['message', 'conversation_id'])
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const executor = await this.executorManager.getExecutorForUser(user.id, conversation_id)

        if (!executor) {
            return response.status(500).json({ error: 'Failed to initialize executor' })
        }

        // Start processing in background without awaiting
        this.processStreamingMessage(
            executor,
            message,
            conversation_id,
            (user.id).toString(),
            session
        ).catch(error => {
            console.error('Background processing error:', error)
        })

        // Return immediately with stream start confirmation
        return response.json({ 
            status: 'stream_started',
            conversation_id: conversation_id
        })
    }

    // Helper to process message
    private async processStreamingMessage(executor: any, message: string, conversation_id: string, user_id: string, session: any) {
        const socket = Ws.io
        let ai_message = ''
        
        try {
            await sleep(2000) // Wait 2 seconds before starting stream

            for await (const chunk of executor.invoke({ 
                input: message, 
                session: session, 
                userId: user_id 
            })) {
                ai_message += chunk
                socket?.emit(`message_${conversation_id}`, {
                    conversationId: conversation_id,
                    content: chunk,
                    userId: user_id
                })
            }

            socket?.emit(`message_${conversation_id}`, {
                conversationId: conversation_id,
                content: "{MESSAGE_ENDS_HERE}",
                userId: user_id
            })

            // Create messages after streaming is complete
            await Message.create({
                conversation_id: parseInt(conversation_id),
                content: message,
                sender: 'user'
            })

            await Message.create({
                conversation_id: parseInt(conversation_id),
                content: ai_message,
                sender: 'bot'
            })
        } catch (error) {
            socket?.emit('error', {
                conversationId: conversation_id,
                error: error.message
            })
            console.error('Streaming processing error:', error)
        }
    }

    async getMessages({ params, response, auth }: HttpContext) {
        const conversationId = params.conversationId
        const user = auth.user
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const messages = await Message.query().where('conversation_id', conversationId)
        return response.json({ messages })
    }
}
