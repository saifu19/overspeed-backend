import { DateTime } from "luxon"
import { column,hasOne,BaseModel } from "@adonisjs/lucid/orm"
import type { HasOne } from "@adonisjs/lucid/types/relations"

import User from '#models/user';
import Project from '#models/project';


export default class ProjectUser extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare role: string;

    @hasOne(() => Project)
    declare project: HasOne<typeof Project>
  
    @hasOne(() => User)
    declare member: HasOne<typeof User>
  
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
  
    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
  }