// services/ProjectService.ts
import Project from '#models/project';
import User from '#models/user';

class ProjectService {
  async createProject(data: any, user: User) {
    try {
      const project = await Project.create({ ...data, createdById: user.id });
      await project.related('users').attach([user.id]);
      return { status: 200, data: project };
    } catch (error) {
      return { status: 500, error: 'Failed to create project' };
    }
  }

  async addUserToProject(projectId: number, userEmail: string, authUser: User) {
    try {
      const project = await Project.findOrFail(projectId);
      if (project.createdById !== authUser.id) throw new Error('Unauthorized');
      
      const userToAdd = await User.findByOrFail('email', userEmail);
      await project.related('users').attach([userToAdd.id]);
      return { status: 200, data: userToAdd };
    } catch (error) {
      return { status: 400, error: error.message };
    }
  }

  async removeUserFromProject(projectId: number, userId: number, authUser: User) {
    try {
      const project = await Project.findOrFail(projectId);

      // Ensure only the project owner can remove users
      if (project.createdById !== authUser.id) throw new Error('Unauthorized');

      await project.related('users').detach([userId]);
      return { status: 200, message: 'User removed successfully' };
    } catch (error) {
      return { status: 400, error: 'Error removing user from project' };
    }
  }

  // Fetch projects where the user is the owner or a member
  async fetchUserProjects(user: any) {
    return await Project.query()
      .where('createdById', user)  // Projects owned by the user
      .orWhereHas('users', (query) => {
        query.where('users.id', user);  // Projects where the user is a member
      })
      .preload('tasks', (taskQuery) => {
        taskQuery.preload('assignee');  // Preload assignee data for each task
      })
      .preload('users');  // Preload users if needed
  }

  // Delete a project if the user is the creator
  async deleteProject(projectId: number, user: User) {
    try {
      const project = await Project.findOrFail(projectId);

      if (project.createdById !== user.id) {
        return { status: 403, error: 'Unauthorized to delete this project' };
      }

      await project.delete();
      return { status: 200, message: 'Project deleted successfully' };
    } catch (error) {
      return { status: 404, error: 'Project not found' };
    }
  }


}

export default new ProjectService();
