import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Project from '#models/project'
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class Conversation extends BaseModel {
	@column({ isPrimary: true })
	declare id: number

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>

	@column()
	declare user_id: number

	@belongsTo(() => Project)
	declare project: BelongsTo<typeof Project>

	@column()
	declare project_id: number

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime
}