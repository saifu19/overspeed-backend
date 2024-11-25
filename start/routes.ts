/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/


import router from '@adonisjs/core/services/router'

const RegisterController = () => import('../app/controllers/auth/register_controller.js')

const LoginController = () => import('../app/controllers/auth/login_controller.js')

const LogoutController = () => import('../app/controllers/auth/logout_controller.js')

const TaskController = () => import('../app/controllers/tasks/task_controller.js');  // TaskController for tasks

const ProjectController = () => import('../app/controllers/projects/projectController.js')

import { middleware } from '#start/kernel'
// import { HttpContext } from '@adonisjs/core/http';


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

router.group(() => {
    router.post('/api/logout/:id', [LogoutController, 'handle']).as('api.logout').use(middleware.auth({
        guards: ['api']
    }))
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
router.group(() => {
    router.post('/api/projects', [ProjectController , 'CreateProject_EndPoint']);
    router.get('/api/projects', [ProjectController , 'FetchProjects_EndPoint']);
    router.post('/api/projects/:id/add-user', [ProjectController , 'AddUser_EndPonit']);
    router.post('/api/projects/:id/remove-user', [ProjectController , 'RemoveUser_EndPoint']);
    router.delete('/api/projects/:projectId', [ProjectController , 'DestroyProject_EndPoint']);

    router.post('/api/projects/:projectId/tasks', [TaskController , 'CreateTask_EndPoint']);
    router.delete('/api/projects/:projectId/tasks/:taskId', [TaskController , 'CreateTask_EndPoint']);


    // router.post('/api/login', [LoginController ,'Login_EndPoint']);


});