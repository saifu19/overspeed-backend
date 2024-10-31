import ProjectService from '#services/projectServices';

import type { HttpContext } from '@adonisjs/core/http';

export default class ProjectController {
  
  // Create a new project
  async store({ request, auth, response, session }: HttpContext) {
    const user = auth.user;
   
    if (!user) {
      session.flash({ error: 'You must be logged in to create a project.' });
      return response.redirect().toPath('/login');  // Redirect to login if not authenticated
    }

    const data = request.only(['name', 'description', 'startDate', 'dueDate', 'budget', 'status']);
    const result = await ProjectService.createProject(data, user);

    if (result.status === 200) {
      return response.redirect().toPath('/projects');
    } else {
      session.flash({ error: result.error || 'An error occurred.' });
      return response.redirect().back();
    }
  }

  // Add user to a project by email (only owner can do this)
  async addUser({ params, request, auth, response, session }: HttpContext) {
    const authUser = auth.user;
    if (!authUser) return response.redirect().toPath('/login');

    const email = request.input('email');
    const result = await ProjectService.addUserToProject(params.id, email, authUser);

    if (result.status === 200) {
      return response.redirect().back();
    } else {
      session.flash({ error: result.error });
      return response.redirect().back();
    }
  }

  // Remove user from a project (only owner can do this)
  async removeUser({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user;
    if (!user) {
      session.flash({ error: 'You must be logged in to remove a user.' });
      return response.redirect().toPath('/login');
    }

    const projectId = params.id;
    const { userId } = request.only(['userId']);

    const result = await ProjectService.removeUserFromProject(projectId, userId, user);

    if (result.status === 200) {
      session.flash({ success: result.message ?? 'Operation completed successfully.' });
      return response.redirect().back();
    } else {
      session.flash({ error: result.error || 'An error occurred.' });
      return response.redirect().back();
    }
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

    // Fetch projects from ProjectService
    const projects = await ProjectService.fetchUserProjects(user);

    return view.render('pages/projects/displayProject', { projects });
}



  // Delete a project
  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user;

    if (!user) {
      session.flash({ error: 'You must be logged in to delete a project.' });
      return response.redirect().toPath('/login');
    }

    const result = await ProjectService.deleteProject(params.projectId, user);

    if (result.status === 200) {
      session.flash({ success: result.message ?? 'Operation completed successfully.' });
      return response.redirect().back();
    } else {
      session.flash({ error: result.error || 'An error occurred.' });
      return response.redirect().back();
    }
  }
  }

