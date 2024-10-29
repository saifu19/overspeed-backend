import { BaseSchema } from '@adonisjs/lucid/schema'



export default class TaskUser extends BaseSchema {
    protected tableName = 'task_user';
  
    public async up() {
      this.schema.createTable(this.tableName, (table) => {
        table.increments('id').primary();
        table
          .integer('task_id')
          .unsigned()
          .references('id')
          .inTable('tasks')
          .onDelete('CASCADE');
        table
          .integer('user_id')
          .unsigned()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.timestamp('created_at', { useTz: true }).defaultTo(this.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(this.now());
  
        table.unique(['task_id', 'user_id']); // Ensures unique combinations of task and user
      });
    }
  
    public async down() {
      this.schema.dropTable(this.tableName);
    }
  }