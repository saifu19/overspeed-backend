import { DateTime } from 'luxon';
import Task from '#models/task';
import Project from '#models/project';
import TaskUser from '#models/task_user';
import User from '#models/user';  // Import User model for type definition


class TaskService {
  // Create a task within a project and assign it to a user if specified
  async createTask({ title, description, dueDate, projectId, createdById, assigneeId, status }: {
    title: string,
    description: string,
    dueDate: string,
    projectId: number,
    createdById: number,
    assigneeId?: number,
    status?: string
  }) {
    // Check if the project exists and preload users
    const project = await Project.query()
      .where('id', projectId)
      .preload('users')
      .first();

    if (!project) {
      return { status: 404, message: 'Project not found.' };
    }

    // Ensure the user is part of the project
    const isMember = project.users.some(user => user.id === createdById);
    if (!isMember) {
      return { status: 403, message: 'You are not authorized to create tasks for this project.' };
    }

    // Convert dueDate to DateTime type
    const dueDateTime = DateTime.fromISO(dueDate);
    if (!dueDateTime.isValid) {
      return { status: 400, message: 'Invalid due date format.' };
    }

    // Create the task and optionally assign a user
    const task = await Task.create({
        title,
        description,
        dueDate: dueDateTime,
        projectId,
        createdById,
        assigneeId: assigneeId ?? undefined,  // Use undefined instead of null
        status: status ?? 'Backlog',
      });
      

    if (assigneeId) {
      await TaskUser.create({
        taskId: task.id,
        userId: assigneeId,
      });
    }

    return { status: 200, message: 'Task created successfully.', data : task };
  }


  async deleteTask(taskId: number, user: User) {

    // Check if the task exists and load related project with users
    const task = await Task.query()
      .where('id', taskId)
      .preload('project', (projectQuery) => projectQuery.preload('users'))
      .first();
    if (!user) {
      return { status: 401, message: 'You must be logged in to delete a task.' };
    }

    if (!task) {
      return { status: 404, message: 'Task not found.' };
    }

    // Check if user is a member of the project
    const isMember = task.project.users.some((projectUser) => projectUser.id === user.id);
    if (!isMember) {
      return { status: 403, message: 'You are not authorized to delete this task.' };
    }

    // Only the creator of the task can delete it
    if (task.createdById !== user.id) {
      return { status: 403, message: 'You are not authorized to delete this task.' };
    }

    await task.delete();
    return { status: 200, message: 'Task deleted successfully.' };
  }

  async updateTaskStatus(taskId: number, newStatus: string) {
    try {
      const task = await Task.findOrFail(taskId);
      // Update the task status
      task.status = newStatus;
      await task.save();

      return {
        status: 200,
        message: 'Task status updated successfully',
        data: task,
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Failed to update task status',
        error: error.message,
      };
    }
  }


}

  


export default new TaskService();


