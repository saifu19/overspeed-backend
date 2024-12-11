import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Conversation from '#models/conversation'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => Conversation)
  declare conversation: BelongsTo<typeof Conversation>

  @column()
  declare conversation_id: number
  
  @column()
  declare content: string

  @column()
  declare sender: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}