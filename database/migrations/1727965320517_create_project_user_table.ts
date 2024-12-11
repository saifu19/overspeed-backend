import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProjectUser extends BaseSchema {
  protected tableName = 'project_user';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table
        .integer('project_id')
        .unsigned()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE');
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('role').notNullable().defaultTo('Developer'); // Add role column
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now());

      table.unique(['project_id', 'user_id']); // Ensures unique combinations of project and user
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
