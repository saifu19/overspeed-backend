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
import AgentsController from '#controllers/agents_controller'


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

    // Agents Routes
    router.get('/api/agents', [AgentsController, 'getAgents']).as('api.agents.get')
    router.post('/api/agents', [AgentsController, 'createAgent']).as('api.agents.create')
    router.get('/api/agents/:id', [AgentsController, 'getAgent']).as('api.agents.getById')
    router.put('/api/agents/:id', [AgentsController, 'updateAgent']).as('api.agents.update')
    router.delete('/api/agents/:id', [AgentsController, 'deleteAgent']).as('api.agents.delete')
    router.post('/api/agents/:id/toggle', [AgentsController, 'toggleAgent']).as('api.agents.toggle')

    // Workflow Routes
    router.group(() => {
        // Basic CRUD operations
        router.post('/workflows', [WorkflowsController, 'createWorkflow'])
            .as('api.workflows.create')

        router.get('/workflows', [WorkflowsController, 'getWorkflows'])
            .as('api.workflows.get')

        router.get('/workflows/:workflowId', [WorkflowsController, 'prepareWorkflow'])
            .as('api.workflows.prepare')

        router.post('/workflows/create-and-prepare', [WorkflowsController, 'createAndPrepareWorkflow'])
            .as('api.workflows.createAndPrepare')

        // Workflow execution
        router.post('/workflows/:workflowId/process', [WorkflowsController, 'processWorkflowStep'])
            .as('api.workflows.process')

        // Workflow States
        router.get('/workflows/:workflowId/states', [WorkflowStatesController, 'getStates'])
            .as('api.workflows.states.get')

        router.post('/workflows/:workflowId/states', [WorkflowStatesController, 'createState'])
            .as('api.workflows.states.create')
    }).prefix('/api')
}).use(middleware.auth({
    guards: ['api']
}))