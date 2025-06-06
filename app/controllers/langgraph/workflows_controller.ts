// app/controllers/langchain/workflows_controller.ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Workflow from '#models/workflow'
import WorkflowState from '#models/workflow_state'
import Tool from '#models/tool'
import GraphManager from '#providers/graph_provider/index'
import ToolsHelper from '#helpers/tools_helper'
import User from '#models/user'
import Ws from '#services/ws';
import { sleep } from '#helpers/utils'
import Agent from '#models/agent'

@inject()
export default class WorkflowsController {
    protected toolsHelper: ToolsHelper
    constructor(protected graphManager: GraphManager) {
        this.toolsHelper = new ToolsHelper()
    }

    async createWorkflow(ctx: HttpContext) {
        const { request, response, user } = ctx
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const { name, description } = request.body()

        const workflow = await Workflow.create({
            user_id: user.id,
            name,
            description
        })

        return response.json({ workflow })
    }

    async prepareWorkflow(ctx: HttpContext) {
        const { params, response, user } = ctx
        const workflowId = params.workflowId

        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const workflow = await Workflow.find(workflowId)

        if (!workflow) {
            return response.status(404).json({ error: 'Workflow not found' })
        }

        try {
            const { states } = await this.prepareGraphHelper(user, workflow)
            return response.json({ states })
        } catch (error) {
            return response.status(500).json({ error: 'Failed to prepare graph, ' + error })
        }
    }

    private async initializeGraphAgents(graph: any) {
        try {
            const tools = await Tool.query().where('is_active', true)
            if (!tools || tools.length === 0) {
                return
            }

            const compiledTools = await Promise.all(
                tools.map(async tool => {
                    try {
                        const compiledTool = await this.toolsHelper.getCompiledTool(tool)
                        return compiledTool
                    } catch (error) {
                        return null
                    }
                })
            )

            const validTools = compiledTools.filter(tool => tool !== null)

            // Query agents and validate their data
            const agents = await Agent.query()
                .where('is_active', true)
                .whereNotNull('name')
                .whereNotNull('system_prompt')
                .whereNotNull('human_prompt')
                .orderBy('order', 'asc')

            if (!agents || agents.length === 0) {
                return
            }

            // Additional validation of agent data
            const validAgents = agents.filter(agent => 
                agent.name?.trim() && 
                agent.system_prompt?.trim() && 
                agent.human_prompt?.trim()
            )

            if (validAgents.length === 0) {
                return
            }

            for (const agent of validAgents) {
                try {
                    await graph.createAgent(
                        agent.name,
                        agent.system_prompt,
                        agent.human_prompt,
                        validTools
                    )
                } catch (error) {
                    throw error
                }
            }

            await graph.buildGraph(validTools)
        } catch (error) {
            throw new Error(`Failed to initialize graph agents: ${error.message}`)
        }
    }

    private async restoreGraphState(graph: any, states: WorkflowState[]) {
        for (const state of states) {
            await graph.processMessage(state.content, state.state_type)
        }
    }

    // private async addToolsToWorkflow() {
    //     try {
    //         const tools = await Tool.query().where('is_active', true)
    //         if (!tools || tools.length === 0) {
    //             console.log('No active tools found')
    //             return []
    //         }

    //         console.log('Found active tools:', tools.length)
    //         const compiledTools = await Promise.all(
    //             tools.map(async tool => {
    //                 try {
    //                     return await this.toolsHelper.getCompiledTool(tool)
    //                 } catch (error) {
    //                     console.error(`Failed to compile tool ${tool.id}:`, error)
    //                     return null
    //                 }
    //             })
    //         )

    //         return compiledTools.filter(tool => tool !== null)
    //     } catch (error) {
    //         console.error('Failed to get tools:', error)
    //         throw new Error(`Failed to get tools: ${error.message}`)
    //     }
    // }

    async getWorkflows(ctx: HttpContext) {
        const { response, user } = ctx
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }
        const workflows = await Workflow.query()
            .where('user_id', user.id)
        return response.json({ workflows })
    }

    async createAndPrepareWorkflow(ctx: HttpContext) {
        const { request, response, user } = ctx
        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        const { name, description } = request.body()

        try {
            const workflow = await Workflow.create({
                user_id: user.id,
                name,
                description
            })

            try {
                const { states } = await this.prepareGraphHelper(user, workflow)
                return response.json({ workflow, states })
            } catch (error) {
                return response.status(500).json({ error: 'Failed to prepare graph, ' + error })
            }
        } catch (error) {
            return response.status(500).json({ 
                error: 'Failed to create and prepare workflow, ' + error 
            })
        }
    }

    async prepareGraphHelper(user: any, workflow: Workflow) {
        try {
            const { graph, didExist } = await this.graphManager.getGraphForUser(user.id, workflow.id)

            const states = await WorkflowState.query()
                .where('workflow_id', workflow.id)
                .orderBy('created_at', 'asc')

            if (!didExist) {
                await this.initializeGraphAgents(graph)
                if (states.length > 0) {
                    await this.restoreGraphState(graph, states)
                }
            }

            return { graph, states }
        } catch (error) {
            console.error('Failed to prepare graph:', error)
            throw new Error(`Failed to prepare graph: ${error.message}`)
        }
    }

    async processWorkflowStep(ctx: HttpContext) {
        const { user, params, request, response } = ctx
        const { workflowId } = params
        const { input } = request.body()

        if (!user) {
            return response.status(401).json({ error: 'Unauthorized' })
        }

        try {
            const { graph }= await this.graphManager.getGraphForUser(user.id, workflowId)
            
            if (!graph) {
                return response.status(500).json({ error: 'Graph not found' })
            }

            // Save input state
            await WorkflowState.create({
                workflow_id: workflowId,
                content: input,
                state_type: 'input',
                agent_name: 'user'
            })

            this.processWorkflowStepHelper(graph, input, workflowId, user)

            return response.json({ message: 'Workflow step processing started' })
        } catch (error) {
            return response.status(500).json({ 
                error: 'Failed to process workflow step: ' + error 
            })
        }
    }

    private async processWorkflowStepHelper(graph: any, input: string, workflowId: number, user: User) {
        const socket = Ws.io
        await sleep(2000)
        const stream = graph.invoke(input)

        for await (const output of stream) {
            await WorkflowState.create({
                workflow_id: workflowId,
                content: output.content,
                state_type: 'output',
                agent_name: output.current_agent
            })
            socket?.emit(`state_${workflowId}`, { output })
        }

        socket?.emit(`state_${workflowId}`, {
            workflowId: workflowId,
            content: "{MESSAGE_ENDS_HERE}",
            userId: user.id
        })
    }
}
