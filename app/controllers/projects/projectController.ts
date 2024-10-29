import Project from '#models/project';
import type { HttpContext } from '@adonisjs/core/http';
import User from '#models/user'

export default class ProjectController {
  
  // Create a new project
  async store({ request, auth, response, session }: HttpContext) {
    const user = auth.user;
   
    if (!user) {
      session.flash({ error: 'You must be logged in to create a project.' });
      return response.redirect().toPath('/login');  // Redirect to login if not authenticated
    }

    const { name, description, startDate, dueDate, budget, status } = request.only([
      'name', 'description', 'startDate', 'dueDate', 'budget', 'status',
    ]);

    const project = await Project.create({
      name,
      description,
      startDate,
      dueDate,
      budget,
      status,
      createdById: user.id,
    });

    
    // Automatically add the owner as a member of the project
    await project.related('users').attach([user.id]);

    return response.redirect().toPath('/projects');
  }

  // Add user to a project by email (only owner can do this)
  async addUser({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user;

    if (!user) {
      session.flash({ error: 'You must be logged in to add a user.' });
      return response.redirect().toPath('/login');
    }

    const project = await Project.find(params.id);
    if (!project) {
      session.flash({ error: 'Project not found.' });
      return response.redirect().back();
    }

    if (project.createdById !== user.id) {
      return response.unauthorized('You are not authorized to add users to this project');
    }

    const { email } = request.only(['email']);
    const newUser = await User.findBy('email', email);

    if (!newUser) {
      session.flash({ error: 'User not found.' });
      return response.redirect().back();
    }

    await project.related('users').attach([newUser.id]);
    return response.redirect().back();
  }

  // Remove user from a project (only owner can do this)
  async removeUser({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user;
    const project = await Project.find(params.id);

    if (!user) {
      session.flash({ error: 'You must be logged in to remove a user.' });
      return response.redirect().toPath('/login');
    }

    if (!project) {
      session.flash({ error: 'Project not found.' });
      return response.redirect().back();
    }

    if (project.createdById !== user.id) {
      return response.unauthorized('You are not authorized to remove users from this project');
    }

    const { userId } = request.only(['userId']);
    await project.related('users').detach([userId]);

    return response.redirect().back();
  }

  // Show form to create a new project
  async create({ view }: HttpContext) {
    return view.render('pages/projects/createProject');
  }

  // Show all projects for a specific user
async index({ view, auth, session, response }: HttpContext) {
  const user = auth.user;

  if (!user) {
    session.flash({ error: 'You must be logged in to view projects.' });
    return response.redirect().toPath('/login');
  }

  // Fetch projects where user is the owner or a member
  const projects = await Project.query()
    .where('createdById', user.id)  // Projects owned by the user
    .orWhereHas('users', (query) => {
      query.where('users.id', user.id);  // Projects where the user is a member, specifying 'users.id' to remove ambiguity
    })
    .preload('tasks', (taskQuery) => {
      taskQuery.preload('assignee');  // Preload assignee data for each task if needed
    })
    .preload('users');  // Optionally preload users to display them

  return view.render('pages/projects/displayProject', { projects });
}



  // Delete a project
  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user;

    if (!user) {
      session.flash({ error: 'You must be logged in to delete a project.' });
      return response.redirect().toPath('/login');
    }

    const project = await Project.find(params.projectId);

    if (!project) {
      session.flash({ error: 'Project not found.' });
      return response.redirect().back();
    }

    // Check if the logged-in user is the creator of the project
    if (project.createdById !== user.id) {
      session.flash({ error: 'You are not authorized to delete this project.' });
      return response.redirect().back();
    }

    await project.delete();
    session.flash({ success: 'Project deleted successfully.' });
    return response.redirect().toPath('/projects');
  }
}
