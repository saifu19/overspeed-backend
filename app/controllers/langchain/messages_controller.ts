import type { HttpContext } from '@adonisjs/core/http'
import ExecutorManager from '#providers/executor_provider/index'
import { inject } from '@adonisjs/core'
import Ws from '#services/ws';
import Message from '#models/message';

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

        const socket = Ws.io
        let ai_message = ''
        
        try {
            for await (const chunk of executor.invoke({ 
                input: message, 
                session: session, 
                userId: user.id 
            })) {
                console.log(chunk)
                ai_message += chunk
                // Emit each chunk through WebSocket
                socket?.emit('message', {
                    conversationId: conversation_id,
                    content: chunk,
                    userId: user.id
                })
            }

            Message.create({
                conversation_id: conversation_id,
                content: message,
                sender: 'user'
            })

            Message.create({
                conversation_id: conversation_id,
                content: ai_message,
                sender: 'bot'
            })
        } catch (error) {
            socket?.emit('error', {
                conversationId: conversation_id,
                error: error.message
            })
            return response.status(500).json({ error: 'Message processing failed' })
        }
    
        return response.json({ status: 'streaming completed' })
    }
}