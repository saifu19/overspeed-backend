import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import ToolsController from '#controllers/langchain/tools_controller'
import WorkflowsController from '#controllers/langgraph/workflows_controller'
import WorkflowStatesController from '#controllers/langgraph/workflow_states_controller'
import RegisterController from '#controllers/auth/register_controller'
import LoginController from '#controllers/auth/login_controller'
import LogoutController from '#controllers/auth/logout_controller'
import ConversationsController from '#controllers/langchain/conversations_controller'
import MessagesController from '#controllers/langchain/messages_controller'
import AgentsController from '#controllers/langgraph/agents_controller'
import MagicLinkController from '#controllers/auth/magic_links_controller'

router.group(() => {
    router.post('/login', [LoginController, 'handle']).as('api.login')
    router.post('/register', [RegisterController, 'handle']).as('api.register')
    router.post('/auth/magic-link', [MagicLinkController, 'generate'])
}).prefix('/api')

// Supabase Auth Routes (unprotected)
router.post('auth/supabase/magic-link', '#controllers/auth/supabase_auth_controller.sendMagicLink')
router.post('auth/supabase/verify', '#controllers/auth/supabase_auth_controller.verifySession')

// Protected Routes Group
router.group(() => {
    // Conversation Routes
    router.post('/conversations', [ConversationsController, 'createConversation'])
    router.get('/conversations/prepare/:conversationId', [ConversationsController, 'prepareConversation'])
    router.post('/conversations/create-and-prepare', [ConversationsController, 'createAndPrepareConversation'])
    router.get('/conversations', [ConversationsController, 'getConversations'])

    // Messages Routes
    router.post('/messages/send', [MessagesController, 'sendMessage'])
    router.get('/messages/:conversationId', [MessagesController, 'getMessages'])

    // Tools Routes
    router.get('/tools', [ToolsController, 'getTools'])
    router.post('/tools', [ToolsController, 'createTool'])

    // Agents Routes
    router.get('/agents', [AgentsController, 'getAgents'])
    router.post('/agents', [AgentsController, 'createAgent'])
    router.get('/agents/:id', [AgentsController, 'getAgent'])
    router.put('/agents/:id', [AgentsController, 'updateAgent'])
    router.delete('/agents/:id', [AgentsController, 'deleteAgent'])
    router.post('/agents/:id/toggle', [AgentsController, 'toggleAgent'])
    router.post('/agents/reorder', [AgentsController, 'reorderAgents'])

    // Workflow Routes
    router.post('/workflows', [WorkflowsController, 'createWorkflow'])
    router.get('/workflows', [WorkflowsController, 'getWorkflows'])
    router.get('/workflows/:workflowId', [WorkflowsController, 'prepareWorkflow'])
    router.post('/workflows/create-and-prepare', [WorkflowsController, 'createAndPrepareWorkflow'])
    router.post('/workflows/:workflowId/process', [WorkflowsController, 'processWorkflowStep'])
    router.get('/workflows/:workflowId/states', [WorkflowStatesController, 'getStates'])
    router.post('/workflows/:workflowId/states', [WorkflowStatesController, 'createState'])
})
.use(middleware.supabaseAuth())
.prefix('/api')