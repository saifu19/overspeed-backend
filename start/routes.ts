import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import ToolsController from '#controllers/langchain/tools_controller'

const RegisterController = () => import('#controllers/auth/register_controller');
const LoginController = () => import('#controllers/auth/login_controller');
const LogoutController = () => import('#controllers/auth/logout_controller');
const ConversationsController = () => import('#controllers/langchain/conversations_controller');
const MessagesController = () => import('#controllers/langchain/messages_controller');


// API Routes
router.group(() => {
    router.post('/api/login', [LoginController, 'handle']).as('api.login')
    router.post('/api/register', [RegisterController, 'handle']).as('api.register')
})

// Add new routes here
router.group(() => {
    router.post('/api/logout/:id', [LogoutController, 'handle']).as('api.logout')

    // Langchain Routes
    router.post('/api/conversations', [ConversationsController, 'createConversation']).as('api.conversations.create')
    router.get('/api/conversations/prepare/:conversationId', [ConversationsController, 'prepareConversation']).as('api.conversations.prepare')
    router.post('/api/conversations/create-and-prepare', [ConversationsController, 'createAndPrepareConversation']).as('api.conversations.createAndPrepare')
    router.get('/api/conversations', [ConversationsController, 'getConversations']).as('api.conversations.get')

    router.post('/api/messages/send', [MessagesController, 'sendMessage']).as('api.messages.send')
    router.get('/api/messages/:conversationId', [MessagesController, 'getMessages']).as('api.messages.get')

    // Tools Routes
    router.get('/api/tools', [ToolsController, 'getTools']).as('api.tools.get')
    router.post('/api/tools', [ToolsController, 'createTool']).as('api.tools.create')
}).use(middleware.auth({
    guards: ['api']
}))