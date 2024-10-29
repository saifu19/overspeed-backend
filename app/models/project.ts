import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo,manyToMany,hasMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, ManyToMany,HasMany  } from '@adonisjs/lucid/types/relations';



import Task from '#models/task';
import User from '#models/user';

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column.dateTime()
  declare startDate: DateTime

  @column.dateTime()
  declare dueDate: DateTime

  @column()
  declare budget: number

  @column()
  declare status: string

  @column()  // Explicit foreign key column
  declare createdById: number;

  @belongsTo(() => User, {
    foreignKey: 'createdById',
  })
  declare createdBy: BelongsTo<typeof User>;

  @manyToMany(() => User, {
    pivotTable: 'project_user',  // Assuming this is the name of your pivot table
  })
  declare users: ManyToMany<typeof User>;

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>;


  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}