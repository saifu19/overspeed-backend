// app/helpers/graph_handler.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

interface GraphState {
    messages: BaseMessage[];
    current_agent: string;
}

// Define state annotation
const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
    }),
    current_agent: Annotation<string>({
        reducer: (_: string, new_: string) => new_
    })
});

export default class GraphHandler {
    private graph: StateGraph<typeof StateAnnotation>;
    private prompts: Map<string, ChatPromptTemplate>;
    private agentOrder: string[];
    private modelName: string;
    private graphId: string | undefined;
    private memory: MemorySaver;
    private messages: BaseMessage[];
    
    constructor() {
        this.prompts = new Map();
        this.agentOrder = [];
        this.modelName = "gpt-4o-mini";
        this.memory = new MemorySaver();
        this.graph = new StateGraph(StateAnnotation);
        this.messages = [];
    }

    async createAgent(name: string, systemPrompt: string, humanPrompt: string, tools: any[] = []) {
        if (!name || !systemPrompt || !humanPrompt) {
            throw new Error("Name, system prompt, and human prompt are required");
        }

        // Create LLM with tools bound
        const llm = new ChatOpenAI({ 
            modelName: this.modelName, 
            streaming: true 
        }).bindTools(tools);

        try {
            // Create prompt template
            const prompt = ChatPromptTemplate.fromMessages([
                { role: "system", content: systemPrompt },
                new MessagesPlaceholder("messages"),
                { role: "human", content: humanPrompt }
            ]);

            this.prompts.set(name, prompt);
            this.agentOrder.push(name);

            // Create node function that calls the model
            const nodeFunction = async (state: GraphState) => {
                const result = await llm.invoke(
                    await prompt.format({
                        messages: state.messages
                    })
                );

                return {
                    messages: [result],
                    current_agent: name
                };
            };

            this.graph.addNode(name, nodeFunction);
            console.log(`Successfully created agent: ${name}`);
        } catch (error) {
            console.error('Error creating agent:', error);
            throw new Error(`Failed to create agent ${name}: ${error.message}`);
        }
    }

    // Function to determine if we should route to tools
    private shouldContinue(state: typeof StateAnnotation.State, nextAgent: string) {
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1] as AIMessage;

        // If the LLM makes a tool call, route to tools
        if (lastMessage.tool_calls?.length) {
            return "tools";
        }
        
        // Otherwise, go to next agent or end
        return nextAgent;
    }

    async buildGraph(tools: any[]) {
        if (this.agentOrder.length === 0) {
            throw new Error("No agents configured");
        }

        // Create tool node
        const toolNode = new ToolNode(tools);
        this.graph.addNode("tools", toolNode);

        // Add start edge to first agent
        this.graph.addEdge(START, this.agentOrder[0]);

        // Add edges between agents and connect each agent to tools
        for (let i = 0; i < this.agentOrder.length; i++) {
            const currentAgent = this.agentOrder[i];
            const nextAgent = i < this.agentOrder.length - 1 ? 
                            this.agentOrder[i + 1] : 
                            END;

            // Add conditional edges for tool routing
            this.graph.addConditionalEdges(
                currentAgent,
                (state) => this.shouldContinue(state, nextAgent),
                {
                    tools: "tools",
                    [nextAgent]: nextAgent
                }
            );

            // Add edge from tools back to the agent
            this.graph.addEdge("tools", currentAgent);
        }
    }

    async processMessage(message: string, state_type: string) {
        if (state_type === "input") {
            this.messages.push(new HumanMessage(message))
        } else if (state_type === "output") {
            this.messages.push(new AIMessage(message))
        }
    }

    async *invoke(input: string) {
        const app = this.graph.compile({
            checkpointer: this.memory
        });

        this.messages.push(new HumanMessage(input))

        const initialState = {
            messages: this.messages,
            current_agent: this.agentOrder[0]
        };
    
        const stream = await app.streamLog(
            initialState,
            { configurable: { thread_id: this.graphId }}
        );
    
        const seenStates = new Set();
    
        for await (const chunk of stream) {
            if (chunk.ops?.[0]?.value?.messages) {
                const state = chunk.ops[0].value;
                const lastMessage = state.messages[state.messages.length - 1];
                
                // Create unique state key
                const stateKey = `${state.current_agent}-${lastMessage.content}`;
                
                if (!seenStates.has(stateKey)) {
                    seenStates.add(stateKey);
                    
                    if (lastMessage.content !== input) {
                        yield {
                            content: lastMessage.content,
                            current_agent: state.current_agent,
                            tool_calls: lastMessage.tool_calls || []
                        };
                    }
                }
            }
        }
    }

    setModel(modelName: string) {
        this.modelName = modelName;
    }

    setGraphId(graphId: string) {
        this.graphId = graphId;
    }
}