import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.group(() => {
    router.post('/login', async () => {
        const LoginController = await import('#controllers/auth/login_controller').then(m => m.default)
        return [LoginController, 'handle']
    }).as('api.login')
    
    router.post('/register', async () => {
        const RegisterController = await import('#controllers/auth/register_controller').then(m => m.default)
        return [RegisterController, 'handle']
    }).as('api.register')
    
    router.post('/auth/magic-link', async () => {
        const MagicLinkController = await import('#controllers/auth/magic_links_controller').then(m => m.default)
        return [MagicLinkController, 'generate']
    })
}).prefix('/api')

// Supabase Auth Routes (unprotected)
router.post('auth/supabase/magic-link', '#controllers/auth/supabase_auth_controller.sendMagicLink')
router.post('auth/supabase/verify', '#controllers/auth/supabase_auth_controller.verifySession')

// Protected Routes Group
router.group(() => {
    // Conversation Routes
    router.post('/conversations', async () => {
        const ConversationsController = await import('#controllers/langchain/conversations_controller').then(m => m.default)
        return [ConversationsController, 'createConversation']
    })
    router.get('/conversations/prepare/:conversationId', async () => {
        const ConversationsController = await import('#controllers/langchain/conversations_controller').then(m => m.default)
        return [ConversationsController, 'prepareConversation']
    })
    router.post('/conversations/create-and-prepare', async () => {
        const ConversationsController = await import('#controllers/langchain/conversations_controller').then(m => m.default)
        return [ConversationsController, 'createAndPrepareConversation']
    })
    router.get('/conversations', async () => {
        const ConversationsController = await import('#controllers/langchain/conversations_controller').then(m => m.default)
        return [ConversationsController, 'getConversations']
    })

    // Messages Routes
    router.post('/messages/send', async () => {
        const MessagesController = await import('#controllers/langchain/messages_controller').then(m => m.default)
        return [MessagesController, 'sendMessage']
    })
    router.get('/messages/:conversationId', async () => {
        const MessagesController = await import('#controllers/langchain/messages_controller').then(m => m.default)
        return [MessagesController, 'getMessages']
    })

    // Tools Routes
    router.get('/tools', async () => {
        const ToolsController = await import('#controllers/langchain/tools_controller').then(m => m.default)
        return [ToolsController, 'getTools']
    })
    router.post('/tools', async () => {
        const ToolsController = await import('#controllers/langchain/tools_controller').then(m => m.default)
        return [ToolsController, 'createTool']
    })

    // Agents Routes
    router.get('/agents', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'getAgents']
    })
    router.post('/agents', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'createAgent']
    })
    router.get('/agents/:id', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'getAgent']
    })
    router.put('/agents/:id', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'updateAgent']
    })
    router.delete('/agents/:id', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'deleteAgent']
    })
    router.post('/agents/:id/toggle', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'toggleAgent']
    })
    router.post('/agents/reorder', async () => {
        const AgentsController = await import('#controllers/langgraph/agents_controller').then(m => m.default)
        return [AgentsController, 'reorderAgents']
    })

    // Workflow Routes
    router.post('/workflows', async () => {
        const WorkflowsController = await import('#controllers/langgraph/workflows_controller').then(m => m.default)
        return [WorkflowsController, 'createWorkflow']
    })
    router.get('/workflows', async () => {
        const WorkflowsController = await import('#controllers/langgraph/workflows_controller').then(m => m.default)
        return [WorkflowsController, 'getWorkflows']
    })
    router.get('/workflows/:workflowId', async () => {
        const WorkflowsController = await import('#controllers/langgraph/workflows_controller').then(m => m.default)
        return [WorkflowsController, 'prepareWorkflow']
    })
    router.post('/workflows/create-and-prepare', async () => {
        const WorkflowsController = await import('#controllers/langgraph/workflows_controller').then(m => m.default)
        return [WorkflowsController, 'createAndPrepareWorkflow']
    })
    router.post('/workflows/:workflowId/process', async () => {
        const WorkflowsController = await import('#controllers/langgraph/workflows_controller').then(m => m.default)
        return [WorkflowsController, 'processWorkflowStep']
    })
    router.get('/workflows/:workflowId/states', async () => {
        const WorkflowStatesController = await import('#controllers/langgraph/workflow_states_controller').then(m => m.default)
        return [WorkflowStatesController, 'getStates']
    })
    router.post('/workflows/:workflowId/states', async () => {
        const WorkflowStatesController = await import('#controllers/langgraph/workflow_states_controller').then(m => m.default)
        return [WorkflowStatesController, 'createState']
    })
})
.use(middleware.supabaseAuth())
.prefix('/api')