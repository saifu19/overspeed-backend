// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { z } from 'zod';
import Tool from '#models/tool';
import Env from '#start/env'
import { DynamicStructuredTool } from "langchain/tools";
import type { ExecutorManager } from '#contracts/langchain'
import { inject } from '@adonisjs/core'

@inject()
export default class ToolsHelper {
    mysql = require('mysql')
	connection = {
		host: Env.get('MYSQL_HOST_MM'),
		user: Env.get('MYSQL_USER_MM'),
		password: Env.get('MYSQL_PASSWORD_MM'),
		database: Env.get('MYSQL_DB_NAME_MM')
	}

    constructor(protected executorManager: ExecutorManager) { }
	
    async toggleTool({ toggleStatus, session, toolId, userId, conversationId }: { toggleStatus: string, session: any, toolId: number, userId: number, conversationId: number }) {
        const tool = await Tool.findOrFail(toolId);
		const executor = await this.executorManager.getExecutorForUser(userId.toString(), conversationId, session);
		let tools = await executor?.getTools();
		if (toggleStatus === "on") {
            const newTool = await this.createCustomTool({ tool, schema: JSON.parse(tool.schema) });
            tools?.push(newTool);
			
			const activeTools = await executor?.getActiveTools();
			activeTools[tool.id] = [
				tools?.length - 1,
			];
			await executor?.setActiveTools({ activeTools })
			await executor?.setTools({ tools })
			await executor?.initExecutor(session.has('assistant') ? session.get('assistant') : null);
			return true;
		} else {
			const activeTools = await executor?.getActiveTools();
			const index = activeTools[tool.id][0];
			let tools = await executor?.getTools();
			if (index !== tools?.length - 1) {
				for (let k in activeTools) {
					if (activeTools[k][0] > index) {
						activeTools[k][0] = activeTools[k][0] - 1;
					}
				}
			}
			delete activeTools[tool.id];
			await executor?.setActiveTools({ activeTools })
			tools?.splice(index, 1);
			await executor?.setTools({ tools })
		}

        return true;
    }

	async createCustomTool({ tool, schema }: { tool: Tool, schema: any }) {
		let zodSchema = z.object({});
		if (schema.length > 0) {
			zodSchema = await this.createZodSchema(schema);
		}
		
		const newTool = this.customToolHelper(tool, zodSchema);
		return newTool;
	}

	async customToolHelper(tool: Tool, zodSchema: any) {
		const schemaKeys = Object.keys(zodSchema.shape);
        interface FunctionArgs {
            [key: string]: any;
        }
		const params = Object.keys(zodSchema.shape).join(',')
		const compiledFunction = await this.compileFunction(params, tool.code)
		const newTool = new DynamicStructuredTool({
			name: tool.name,
			description: tool.description,
			schema: zodSchema,
			func: async (args: FunctionArgs) => {
				let functionArgs: FunctionArgs = {};
				schemaKeys.forEach(key => {
					functionArgs[key] = args[key];
				});
				return await compiledFunction(require, functionArgs);
			},
		});
		return newTool;
	}

	async createSchema(propertyNames: string[], propertyTypes: string[], propertyDescriptions: string[], propertyRequired: string[]) {
		let schema;
		if (typeof propertyNames !== 'string') {
			schema = propertyNames.map((name: string, i: number) => ({
				name: name,
				type: propertyTypes[i],
				description: propertyDescriptions[i],
				optional: propertyRequired[i] === "true" ? false : true,
			}));
		}
		return schema;
	}

	async createZodSchema(schemaArray: any[]) {
        interface SchemaObject {
            [key: string]: z.ZodType;
        }
		const schemaObject: SchemaObject = {};
	
		schemaArray.forEach((field: any) => {
			if (field.type == 'number' && field.optional) {
				schemaObject[field.name] = z.number().optional().describe(field.description);
			} else if (field.type == 'string' && field.optional) {
				schemaObject[field.name] = z.string().optional().describe(field.description);
			} else if (field.type == 'boolean' && field.optional) {
				schemaObject[field.name] = z.boolean().optional().describe(field.description);
			} else if (field.type == 'date' && field.optional) {
				schemaObject[field.name] = z.date().optional().describe(field.description);
			} else if (field.type == 'number') {
				schemaObject[field.name] = z.number().describe(field.description);
			} else if (field.type == 'string') {
				schemaObject[field.name] = z.string().describe(field.description);
			} else if (field.type == 'boolean') {
				schemaObject[field.name] = z.boolean().describe(field.description);
			} else if (field.type == 'date') {
				schemaObject[field.name] = z.date().describe(field.description);
			} else if (field.type == 'string_array') {
				schemaObject[field.name] = z.array(z.string()).describe(field.description);
			} else if (field.type == 'number_array') {
				schemaObject[field.name] = z.array(z.number()).describe(field.description);
			} else {
				throw new Error(`Unsupported type: ${field.type}`);
			}
		});
	
		return z.object(schemaObject);
	}

	async compileFunction(params: string, code: string) {

		const compiledFunction = new Function('require', 'args', `
			return (async () => {
				let result;
				if (args !== undefined) {
					const {${params}} = args;
					result = await (async function(${params}) { ${code} })(${params});
				} else {
					result = await (async function() { ${code} })();
				}
				console.log(String(result))
				return String(result);
			})();
		`);

		return compiledFunction;
	}
}