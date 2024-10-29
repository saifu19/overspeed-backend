import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Tasks extends BaseSchema {
  protected tableName = 'tasks';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description').notNullable();
      table.text('acceptability_criteria');
      table.string('type');
      table.dateTime('start_date').nullable;
      table.dateTime('due_date').nullable();
      table.string('status').defaultTo('pending');
      table
        .integer('project_id')
        .unsigned()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE');
      table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE'); // Foreign key to users
      table.integer('priority').defaultTo(1);
      table.integer("assignee_id").unsigned().references("id").inTable("users").nullable().defaultTo(null);

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
