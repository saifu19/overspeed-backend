import ProjectService from '#services/projectServices';
// import { prettyPrintError } from '@adonisjs/core';

import type { HttpContext } from '@adonisjs/core/http';

export default class ProjectController {

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

	async create({ view }: HttpContext) {
		return view.render('pages/projects/createProject');
	}

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




  




  // API End-Points for calling 

  // Create a new project - API Endpoint
  public async CreateProject_EndPoint({ request, auth, response }: HttpContext) {
    const user = auth.user;

    if (!user) {
      console.log("hit 401")
      return response.status(401).json({
        status: 'error',
        message: 'You must be logged in to view projects.',
      });
    }

    // Extract relevant fields from the request body
    const data = request.only(['name', 'description', 'startDate', 'dueDate', 'budget', 'status']);

    // Call the service function to create the project
    const result = await ProjectService.createProject(data, user);

    // Handle the response from the service
    if (result.status === 200) {
      return response.status(200).json({ status: 'success' , message: 'Project created successfully', project: result.data });
    } else {
      return response.status(500).json({ status: 'error' , error: result.error || 'Failed to create the project.' });
    }
  }

  // Show all projects for a specific user - API Endpoint
  public async FetchProjects_EndPoint({ auth, response }: HttpContext) {
    console.log("hit ")
    try {
      const user = auth.user;

      if (!user) {
        console.log("hit 401")
        return response.status(401).json({
          status: 'error',
          message: 'You must be logged in to view projects.',
        });
      }

      // Fetch projects from ProjectService
      const projects = await ProjectService.fetchUserProjects(user);
      
      console.log("hit 200")
      return response.status(200).json({
        status: 'success',
        message: 'Projects fetched successfully',
        projects: projects,  // Return the projects
      });

    } catch (error) {
      console.error('Error fetching projects:', error);
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching projects.',
      });
    }
  }
  


  // Add user to a project by email (only owner can do this) - API Endpoint
public async AddUser_EndPonit({ params, request, auth, response }: HttpContext) {
  const user = auth.user;

  // Check if the authenticated user is available
  if (!user) {
    console.log("hit 401")
    return response.status(401).json({
      status: 'error',
      message: 'You must be logged in to view projects.',
    });
  }

  // Extract email from the request body
  const email = request.input('email');

  // Call the service function to add the user
  const result = await ProjectService.addUserToProject(params.id, email, user);

  // Handle the service function's response
  if (result.status === 200) {
    return response.status(200).json({status:'success', message: 'User added to project successfully', user: result.data });
  } else {
    return response.status(500).json({ status:'error', error: result.error || 'Failed to add user to the project.' });
  }
}

// Remove user from a project (only owner can do this) - API Endpoint
public async RemoveUser_EndPoint({ params, request, auth, response }: HttpContext) {
  const user = auth.user;

  if (!user) {
    console.log("hit 401")
    return response.status(401).json({
      status: 'error',
      message: 'You must be logged in to view projects.',
    });
  }

  // Extract project ID from params and user ID from the request body
  const projectId = params.id;
  const { userId } = request.only(['userId']);

  // Call the service function to remove the user
  const result = await ProjectService.removeUserFromProject(projectId, userId, user);

  // Handle the service function's response
  if (result.status === 200) {
    return response.status(200).json({ status: 'success',message: result.message ?? 'User removed successfully' });
  } else {
    return response.status(500).json({status:'error', error: result.error || 'Failed to remove user from the project.' });
  }
}

// Delete a project - API Endpoint
public async DestroyProject_EndPoint({ params, auth, response }: HttpContext) {
  const user = auth.user;

  if (!user) {
    console.log("hit 401")
    return response.status(401).json({
      status: 'error',
      message: 'You must be logged in to view projects.',
    });
  }

  // Extract project ID from params
  const projectId = params.projectId;

  // Call the service function to delete the project
  const result = await ProjectService.deleteProject(projectId, user);

  // Handle the service function's response
  if (result.status === 200) {
    return response.status(200).json({status:'success', message: result.message ?? 'Project deleted successfully' });
  } else {
    return response.status(500).json({status:'error', error: result.error || 'Failed to delete the project.' });
  }
}




  }

