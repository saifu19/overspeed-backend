import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'modify_user_id_to_uuid'

  async up() {
    // Drop auth_access_tokens table first as it references users
    if (await this.schema.hasTable('auth_access_tokens')) {
      this.schema.dropTable('auth_access_tokens')
    }

    // Modify conversations table
    this.schema.alterTable('conversations', (table) => {
      table.uuid('user_id_uuid').notNullable()
    })
    this.schema.alterTable('conversations', (table) => {
      table.dropColumn('user_id')
    })
    this.schema.alterTable('conversations', (table) => {
      table.renameColumn('user_id_uuid', 'user_id')
    })

    // Modify workflows table
    this.schema.alterTable('workflows', (table) => {
      table.uuid('user_id_uuid').notNullable()
    })
    this.schema.alterTable('workflows', (table) => {
      table.dropColumn('user_id')
    })
    this.schema.alterTable('workflows', (table) => {
      table.renameColumn('user_id_uuid', 'user_id')
    })

    // Drop the users table as we'll use Supabase for user management
    if (await this.schema.hasTable('users')) {
      this.schema.dropTable('users')
    }
  }

  async down() {
    // Recreate users table first
    this.schema.createTable('users', (table) => {
      table.increments('id').primary()
      table.string('email', 255).notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Recreate auth_access_tokens table
    this.schema.createTable('auth_access_tokens', (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('type').notNullable()
      table.string('token', 64).notNullable().unique()
      table.text('token_secret').nullable()
      table.integer('tokenable_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('expires_at').nullable()
    })

    // Revert conversations table
    this.schema.alterTable('conversations', (table) => {
      table.renameColumn('user_id', 'user_id_uuid')
    })
    this.schema.alterTable('conversations', (table) => {
      table.integer('user_id').unsigned().notNullable()
    })
    this.schema.alterTable('conversations', (table) => {
      table.dropColumn('user_id_uuid')
    })

    // Revert workflows table
    this.schema.alterTable('workflows', (table) => {
      table.renameColumn('user_id', 'user_id_uuid')
    })
    this.schema.alterTable('workflows', (table) => {
      table.integer('user_id').unsigned().notNullable()
    })
    this.schema.alterTable('workflows', (table) => {
      table.dropColumn('user_id_uuid')
    })
  }
}