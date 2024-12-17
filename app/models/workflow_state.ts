// app/models/workflow_state.ts
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Workflow from '#models/workflow'

export default class WorkflowState extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => Workflow)
  declare workflow: BelongsTo<typeof Workflow>

  @column()
  declare workflow_id: number
  
  @column()
  declare content: string

  @column()
  declare agent_name: string

  @column()
  declare state_type: string // Can be 'input', 'output', or 'intermediate'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}