import type { HttpContext } from '@adonisjs/core/http';
import TaskService from '#services/taskServices';
import User from '#models/user'


export default class TaskController {

  // Create a task in a project
  async store({ request, params, auth, response, session }: HttpContext) {
    const user = auth.user;
    if (!user) {
      session.flash({ error: 'You must be logged in to create a task.' });
      return response.redirect().toPath('/login');
    }

    const { title, description, dueDate, assigneeId } = request.only(['title', 'description', 'dueDate', 'assigneeId']);
    const projectId = params.projectId;

    // Call service to create task
    const result = await TaskService.createTask({
      title,
      description,
      dueDate,
      projectId: Number(projectId),
      createdById: user.id,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
    });

    // Handle response based on status
    if (result.status === 201) {
      session.flash({ success: result.message });
      return response.redirect().toPath(`/projects/`);
    } else {
      session.flash({ error: result.message });
      return response.redirect().back();
    }
  }
  

  // Delete a task (Only users in the project can delete tasks)
  async destroy({ params, auth, response, session }: HttpContext) {
    // First, check if the user is authenticated
    if (!auth.user) {
      session.flash({ error: 'You must be logged in to delete a task.' });
      return response.redirect().toPath('/login');
    }

    // Now that we know auth.user is defined, create a strictly typed User variable
    const user = auth.user as User;
    const taskId = Number(params.taskId);

    const result = await TaskService.deleteTask(taskId, user);

    if (result.status === 200) {
      session.flash({ success: result.message });
      return response.redirect().toPath('/projects');
    } else {
      session.flash({ error: result.message });
      return response.redirect().back();
    }
  }


  //API EndPoints

  // Create a task in a project - API Endpoint
  public async CreateTask_EndPoint({ request, params, auth, response }: HttpContext) {
    const user = auth.user;

    if (!user) {
      return response.status(401).json({
        status: 'error',
        message: 'You must be logged in to view projects.',
      });
    }

    // Extract data from the request body
    const { title, description, dueDate, assigneeId } = request.only(['title', 'description', 'dueDate', 'assigneeId']);
    const projectId = params.projectId;

    // Call the service function to create the task
    const result = await TaskService.createTask({
      title,
      description,
      dueDate,
      projectId: Number(projectId),
      createdById: user.id,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
    });

    // Return the service response as JSON
    if (result.status === 200) {
      return response.status(200).json({status:'success',message: result.message, task: result.data });
    } else {
      return response.status(500).json({ status:'error', error: result.message || 'Failed to create task.' });
    }
  }


  // Delete a task - API Endpoint
  public async DestroyTask_EndPoint({ params, auth, response }: HttpContext) {

    console.log("hello");

    const user = auth.user;

    if (!user) {
      return response.status(401).json({
        status: 'error',
        message: 'You must be logged in to view projects.',
      });
    }

    // Extract the task ID from the request params
    const taskId = Number(params.taskId);

    // Call the service function to delete the task
    const result = await TaskService.deleteTask(taskId, user);

    // Return the service response as JSON
    if (result.status === 200) {
      return response.status(200).json({status:'success', message: result.message });
    } else {
      return response.status(500).json({ status:'error',error: result.message || 'Failed to delete task.' });
    }
  }


}
