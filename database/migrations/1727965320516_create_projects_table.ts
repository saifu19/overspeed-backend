import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Projects extends BaseSchema {
  protected tableName = 'projects';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description').notNullable();
      table.dateTime('start_date').notNullable();
      table.dateTime('due_date').notNullable();
      table.decimal('budget', 12, 2).notNullable();
      table.string('status').defaultTo('pending');
      // createdById column with foreign key reference to users table
      table.integer('created_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now());
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
