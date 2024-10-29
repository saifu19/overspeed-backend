import Task from '#models/task';
import type { HttpContext } from '@adonisjs/core/http';
import Project from '#models/project';
import TaskUser from '#models/task_user'; // Import the pivot model


export default class TaskController {

  // Create a task in a project
  async store({ request, params, auth, response, session }: HttpContext) {
    const user = auth.user;
    const { title, description, dueDate, assigneeId } = request.only(['title', 'description', 'dueDate', 'assigneeId']);
    const projectId = params.projectId;

    // Check if the project exists
    const project = await Project.query()
      .where('id', projectId)
      .preload('users')  // Preload project users
      .first();

    if (!project) {
      session.flash({ error: 'Project not found.' });
      return response.redirect().back();
    }

    if (!user) {
      session.flash({ error: 'You must be logged in to create a task.' });
      return response.redirect().toPath('/login');
    }

    // Ensure the user is part of the project
    const isMember = project.users.some((projectUser) => projectUser.id === user.id);
    if (!isMember) {
      session.flash({ error: 'You are not authorized to create tasks for this project.' });
      return response.redirect().back();
    }

    // Create the task associated with the project and assigned user
    const task = await Task.create({
      title,
      description,
      dueDate,
      projectId: project.id,
      createdById: user.id,
      assigneeId: assigneeId || null,
    });

    // Assign the task to the specified user if assignedUserId is provided
    if (assigneeId) {
      await TaskUser.create({
        taskId: task.id,
        userId: assigneeId,
      });
    }

    return response.redirect().toPath(`/projects/`);
  }

  // Delete a task (Only users in the project can delete tasks)
  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user;
    
    const task = await Task.query()
      .where('id', params.taskId)
      .preload('project', (projectQuery) => projectQuery.preload('users'))
      .first();

    if (!user) {
      session.flash({ error: 'You must be logged in to delete a task.' });
      return response.redirect().toPath('/login');
    }

    if (!task) {
      session.flash({ error: 'Task not found.' });
      return response.redirect().back();
    }

    const isMember = task.project.users.some((projectUser) => projectUser.id === user.id);
    if (!isMember) {
      return response.unauthorized('You are not authorized to delete this task');
    }

    // Only delete if the user is the creator of the task
    if (task.createdById !== user.id) {
      return response.unauthorized('You are not authorized to delete this task');
    }

    await task.delete();
    return response.redirect().toPath('/projects');
  }
}
