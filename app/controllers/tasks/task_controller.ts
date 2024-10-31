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
}
