import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tools'

  async up() {
    this.schema.table(this.tableName, (table) => {
      table.text('code', 'longtext').alter()
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.string('code').alter()
    })
  }
}