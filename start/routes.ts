import router from '@adonisjs/core/services/router'
// import RegisterController from '#controllers/auth/register_controller'
// import LoginController from '#controllers/auth/login_controller'
// import LogoutController from '#controllers/auth/logout_controller'
// import TaskController from '#controllers/tasks/task_controller'
// import ProjectController from '#controllers/projects/project_controller'
// import ConversationsController from '#controllers/langchain/conversations_controller';
// import MessagesController from '#controllers/langchain/messages_controller';
import { middleware } from '#start/kernel'


const RegisterController = () => import('#controllers/auth/register_controller');
const LoginController = () => import('#controllers/auth/login_controller');
const LogoutController = () => import('#controllers/auth/logout_controller');
const TaskController = () => import('#controllers/tasks/task_controller');
const ProjectController = () => import('#controllers/projects/project_controller');
const ConversationsController = () => import('#controllers/langchain/conversations_controller');
const MessagesController = () => import('#controllers/langchain/messages_controller');






router.get('/', async (ctx) => {

    await ctx.auth.check()

    return ctx.view.render('pages/home')


})

router.group(() => {

    router.get('/register', [RegisterController, 'show']).as('register.show')
    router.post('/register', [RegisterController, 'store']).as('register.store')

    router.get('/login', [LoginController, 'show']).as('login.show')
    router.post('/login', [LoginController, 'store']).as('login.store')

    router.post('/logout', [LogoutController, 'handle']).as('logout')

}).as('auth')

// API Routes
router.group(() => {
    router.post('/api/login', [LoginController, 'handle']).as('api.login')
    router.post('/api/register', [RegisterController, 'handle']).as('api.register')
})

// Add new routes here
router.group(() => {
    router.post('/api/logout/:id', [LogoutController, 'handle']).as('api.logout')

    router.post('/api/projects', [ProjectController, 'CreateProject_EndPoint']).as('api.createProject');
    router.post('/api/projects/:id/add-user', [ProjectController, 'AddUser_EndPonit']);
    router.post('/api/projects/:id/remove-user', [ProjectController, 'RemoveUser_EndPoint']);
    router.delete('/api/projects/:projectId', [ProjectController, 'DestroyProject_EndPoint']);

    router.post('/api/projects/:projectId/tasks', [TaskController, 'CreateTask_EndPoint']);
    router.delete('/api/projects/:projectId/tasks/:taskId', [TaskController, 'DestroyTask_EndPoint']);
    router.patch('/api/projects/:projectId/tasks/:taskId/status', [TaskController, 'UpdateTaskStatus_EndPoint'])

    router.get('/api/projects', [ProjectController , 'FetchProjects_EndPoint']);

    // Langchain Routes
    router.post('/api/conversations', [ConversationsController, 'createConversation']).as('api.conversations.create')
    router.post('/api/conversations/prepare', [ConversationsController, 'prepareConversation']).as('api.conversations.prepare')
    router.post('/api/conversations/create-and-prepare', [ConversationsController, 'createAndPrepareConversation']).as('api.conversations.createAndPrepare')
    router.get('/api/conversations/:projectId', [ConversationsController, 'getConversations']).as('api.conversations.get')

    router.post('/api/messages/send', [MessagesController, 'sendMessage']).as('api.messages.send')
    router.get('/api/messages/:conversationId', [MessagesController, 'getMessages']).as('api.messages.get')
}).use(middleware.auth({
    guards: ['api']
}))


router.group(() => {
    // Project routes
    router.get('/projects', [ProjectController, 'index']).as('projects.index').use(middleware.auth());
    router.post('/projects', [ProjectController, 'store']).as('projects.store').use(middleware.auth());
    router.get('/projects/create', [ProjectController, 'create']).as('projects.create').use(middleware.auth());
    router.post('/projects/:projectId', [ProjectController, 'destroy']).as('projects.destroy').use(middleware.auth());

    router.post('/projects/:id/add-user', [ProjectController, 'addUser']).as('projects.addUser').use(middleware.auth());
    router.post('/projects/:id/remove-user', [ProjectController, 'removeUser']).as('projects.removeUser').use(middleware.auth());

    // Task routes within a project
    router.post('/projects/:projectId/tasks', [TaskController, 'store']).as('projects.tasks.store');
    router.post('/projects/:projectId/tasks/:taskId', [TaskController, 'destroy']).as('tasks.destroy');
}).use(middleware.auth());





//API EndPoints
// router.group(() => {
//     router.post('/api/projects', [ProjectController , 'CreateProject_EndPoint']);
//     router.get('/api/projects', [ProjectController , 'FetchProjects_EndPoint']);
//     router.post('/api/projects/:id/add-user', [ProjectController , 'AddUser_EndPonit']);
//     router.post('/api/projects/:id/remove-user', [ProjectController , 'RemoveUser_EndPoint']);
//     router.delete('/api/projects/:projectId', [ProjectController , 'DestroyProject_EndPoint']);

//     router.post('/api/projects/:projectId/tasks', [TaskController , 'CreateTask_EndPoint']);
//     router.delete('/api/projects/:projectId/tasks/:taskId', [TaskController , 'CreateTask_EndPoint']);


//     // router.post('/api/login', [LoginController ,'Login_EndPoint']);


// });