import { DateTime } from "luxon"
import { column,BaseModel,hasOne } from "@adonisjs/lucid/orm"
import type { HasOne } from "@adonisjs/lucid/types/relations"

import Task from '#models/task';
import User from '#models/user';

export default class TaskUser extends BaseModel {

    public static table = 'task_user';

    @column({ isPrimary: true })
    declare id: number

    @column()  // Add taskId column
    declare taskId: number;

    @column()  // Add userId column
    declare userId: number;

    @hasOne(() => Task, {
      foreignKey: 'taskId',
    })
    declare task: HasOne<typeof Task>;
  
    @hasOne(() => User, {
      foreignKey: 'userId',
    })
    declare assignee: HasOne<typeof User>;
  
  
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
  
    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
  }