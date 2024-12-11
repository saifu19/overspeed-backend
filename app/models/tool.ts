import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Tool extends BaseModel {
	@column({ isPrimary: true })
	declare id: number

	@column()
	declare name: string

	@column()
	declare description: string

	@column()
	declare code: string

	@column()
	declare schema: string

	@column()
	declare is_active: boolean

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime
}