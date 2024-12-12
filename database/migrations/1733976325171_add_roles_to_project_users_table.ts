import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'project_user'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('role').notNullable();
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('role');
		})
	}
}