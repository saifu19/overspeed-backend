/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

// import RegisterController from '#controllers/auth/register_controller'
// import LoginController from '#controllers/auth/login_controller'
// import LogoutController from '#controllers/auth/logout_controller'

import router from '@adonisjs/core/services/router'

const RegisterController = () => import('../app/controllers/auth/register_controller.js')

const LoginController = () => import('../app/controllers/auth/login_controller.js')

const LogoutController = () => import('../app/controllers/auth/logout_controller.js')

const TaskController = () => import('../app/controllers/tasks/task_controller.js');  // TaskController for tasks

const ProjectController = () => import('../app/controllers/projects/projectController.js')

import { middleware } from '#start/kernel'


router.get('/', async (ctx) => {

    await ctx.auth.check()

    return ctx.view.render('pages/home')


} )

// router.get('/dummy', async ( { view } ) => {


//     return view.render('pages/home')


// } )


router.group(() => {
    
    router.get('/register',[RegisterController,'show']).as('register.show')
    router.post('/register',[RegisterController,'store']).as('register.store')

    router.get('/login',[LoginController,'show']).as('login.show')
    router.post('/login',[LoginController,'store']).as('login.store')

    router.post('/logout',[LogoutController,'handle']).as('logout')

}).as('auth')

// Task routes (create, list)
// router.group(() => {
//     router.get('/tasks', [TaskController, 'index']).as('tasks.index').use(middleware.auth());  // List tasks
//     router.get('/tasks/create', [TaskController, 'create']).as('tasks.create').use(middleware.auth());  // Show create task form
//     router.post('/tasks', [TaskController, 'store']).as('tasks.store').use(middleware.auth());  // Store task
//   }).use(middleware.auth())
//   .as('task');  // These routes are protected and require authentication

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