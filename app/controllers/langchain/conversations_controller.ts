import Conversation from '#models/conversation'
import Tool from '#models/tool'
import ExecutorManager from '#providers/executor_provider/index'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ToolsHelper from '#helpers/tools_helper'

@inject()
export default class ConversationsController {
    protected toolsHelper: ToolsHelper
    constructor(protected executorManager: ExecutorManager) {
        this.toolsHelper = new ToolsHelper()
    }

    async createConversation(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.create({
            user_id: ctx.user.id
        })

        return response.json({ conversation })
    }

    async prepareConversation(ctx: HttpContext) {
        const { params, response } = ctx
        const conversationId = params.conversationId

        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversation = await Conversation.query()
            .where('id', conversationId)
            .where('user_id', ctx.user.id)
            .first()

        if (!conversation) {
            return response.status(404).json({ error: 'Conversation not found' })
        }

        const executor = await this.executorManager.getExecutorForUser(ctx.user.id, conversation.id)

        if (!executor) {
            return response.status(500).json({ error: 'Failed to initialize executor' })
        }

        await executor.setPrompt(this.getPrompt());

        await this.addToolsToConversation(ctx.user.id, conversation.id)

        return response.json({ conversation })
    }

    private async addToolsToConversation(userId: string, conversationId: number) {
        const tools = await Tool.query().where('is_active', true)
        for (const tool of tools) {
            await this.toolsHelper.toggleTool({
                toggleStatus: 'on',
                toolId: tool.id,
                userId,
                conversationId: conversationId,
                executorManager: this.executorManager
            })
        }
    }

    async getConversations(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const conversations = await Conversation.query()
            .where('user_id', ctx.user.id)
            .orderBy('created_at', 'desc')

        return response.json({ conversations })
    }

    async createAndPrepareConversation(ctx: HttpContext) {
        const { response } = ctx
        if (!ctx.user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        try {
            const conversation = await Conversation.create({
                user_id: ctx.user.id
            })

            const executor = await this.executorManager.getExecutorForUser(ctx.user.id, conversation.id)

            if (!executor) {
                return response.status(500).json({ error: 'Failed to initialize executor' })
            }
            await executor.setPrompt(this.getPrompt());
            await this.addToolsToConversation(ctx.user.id, conversation.id)
            return response.json({ conversation })
        } catch (error) {
            console.error('Error creating and preparing conversation:', error)
            return response.status(500).json({ error: 'Failed to create and prepare conversation' })
        }
    }

    getPrompt() {
        return `
            You are a specialized assistant that, given a fan specification object (model, size, required RPM, temperature, wheel material, etc.), produces an SQL query to find similar historical orders in a Supabase database.  
 
Tables:  
- 'shop_orders' (the main historical orders table) with columns:  
  - 'order_num' (text)  
  - 'model' (text)  
  - 'size' (text)  
  - 'motor_rpm' (text)  -- often stores integer values  
  - 'rpm' (text)        -- often stores integer values  
  - 'class' (text)  
  - 'arrangement' (text)  
  - 'width_percentage' (text)  
  - 'diameter_percentage' (text)  
  - 'temp' (text)       -- often stores integer values  
  - 'wheel_material' (text)  
  - 'calendar_date' (text)  
  - 'item_id' (text)  

- 'rpm_data' (optional reference table) with columns:  
  - 'Model', 'ModelSizeText', 'nominalwheelsize', 'WheelDiameter', 'FanClassText',  
    'DriveMethod', 'ArrangementCode', 'DischargeCode', 'LowerRPMLimit', 'UpperRPMLimit',  
    'LowerBDRPMLimit', 'UpperBDRPMLimit', 'BHPLimit', 'FanClassNumber'  , 'item_id'
  
Required Inputs:  
1. 'model' (mandatory; DO NOT PROCEED IF NOT PROVIDED)  
2. 'size' (optional)  
3. 'required RPM' (optional)  
4. 'operating temperature' (optional)  
5. 'wheel material' (optional)  
6. 'arrangement code', 'fan class text', etc. (optional—only include if relevant)  
  
Definition of Similar Orders:
1. Same 'model' (case-insensitive).  
2. Same 'size' (only if provided).  
3. 'motor_rpm' and 'rpm' contain only numeric values ('~ '^\\d+$'').  
4. 'temp' contains only numeric values ('~ '^\\d+$'').  
5. 'CAST(rpm AS INTEGER) >= CAST(motor_rpm AS INTEGER)'.  
6. 'CAST(motor_rpm AS INTEGER) >= <required RPM>' (if provided).  
7. 'CAST(temp AS INTEGER) >= <operating temperature>' (if provided).  
8. Same 'wheel_material' (if provided).  
9. (Optional) Filter by additional constraints from 'rpm_data', such as 'ArrangementCode' or 'FanClassText' if provided.  
10. ORDER BY 'CAST(rpm AS INTEGER)' DESC.  
11. Fetch up to 50 rows.  
  
Instructions:  
1. If 'model' is missing, ask specifically for it. Do not proceed without it.  
2. If any optional fields are missing or are 'N/A', ignore them in the query's WHERE clause.  
3. ALWAYS Join with 'rpm_data':  
   '''sql
   FROM shop_orders 
   JOIN rpm_data 
        ON shop_orders.item_id = rpm_data.item_id
   '''
   Then add any conditions for 'ArrangementCode', 'FanClassText', etc.  
4. Only return relevant columns: 'order_num', 'model', 'size', 'motor_rpm', 'rpm', 'class', 'arrangement', 'width_percentage', 'diameter_percentage', 'temp', 'wheel_material', 'calendar_date'.  
5. Show at least 25 rows of the output, if possible.  
6. Execute the query and show the results. Your user is not a programmer they dont need to see the query.
        `
    }
}
