import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
// import type { HasOne } from '@adonisjs/lucid/types/relations';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

import User from '#models/user';
import Project from '#models/project';


export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare acceptabilityCriteria: string

  @column()
  declare type: string

  @column.dateTime()
  declare startDate: DateTime

  @column.dateTime()
  declare dueDate: DateTime

  @column()
  declare status: string

  // Adjust project and createdBy fields to use `belongsTo` relationships
  @column()
  declare projectId: number;

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>;

  @column()
  declare createdById: number;

  @belongsTo(() => User, {
    foreignKey: 'createdById',
  })
  declare createdBy: BelongsTo<typeof User>;


  @column()  // Field to store the assigned user ID
  declare assigneeId: number;

  @belongsTo(() => User, {
    foreignKey: "assigneeId",  // Use this to link the assignee field
  })
  declare assignee: BelongsTo<typeof User>;

  @column()
  declare priority: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}