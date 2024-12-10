import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import {
    ChatPromptTemplate,
    MessagesPlaceholder
} from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import Ws from '#services/ws';
// import { CallbackHandler } from "langfuse-langchain"

export default class Executor {

    protected executor: RunnableWithMessageHistory<any, any> | undefined;
    protected memory: BufferMemory;
    protected tools: Array<any>;
    protected prompt: ChatPromptTemplate;
    protected promptString: string;
    protected activeTools: Object;
    protected modelName: string;
    protected executorId: string | undefined;

    constructor() {
        this.tools = [
            new SerpAPI(),
        ];

        this.memory = new BufferMemory({
            memoryKey: "history",
            inputKey: "question",
            outputKey: "answer",
            returnMessages: true,
        });

        this.activeTools = {};
        this.promptString = "you are a helpful assistant."
        this.prompt = ChatPromptTemplate.fromMessages([
            ["human", this.promptString],
            ["ai", "Instructions noted! I will do my best to help you."],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
            new MessagesPlaceholder("agent_scratchpad"),
        ]);
        this.modelName = "gpt-4o-mini"
        this.initExecutor();
    }

    public async *invoke({ input, session, userId }: { input: string, session: any, userId: number }): AsyncGenerator<string> {
        try {
            let result;
            result = this.executor?.streamLog({
                input: input,
            }, {
                configurable: {
                    sessionId: session.sessionId,
                },
            });

            let stopAnswer = false;
            let resolvePromise;

            const waitForStop = new Promise((resolve) => {
                resolvePromise = resolve;
                Ws.io?.once('connection', (socket) => {
                    const stopListener = (data: any) => {
                        if (data.executorId === this.executorId) {
                            stopAnswer = true;
                            socket.removeListener('stop', stopListener);
                            resolve("Ready!");
                        }
                    };

                    socket.once('stop', stopListener);

                    function cleanup() {
                        socket.removeListener('stop', stopListener);
                        Ws.io?.removeListener('connection', stopListener);
                    }

                    waitForStop.catch(() => {
                        cleanup();
                    });
                });
            });

            yield '{FIRST TOKEN}'

            waitForStop.catch((error) => {
                console.error(error);
            });

            if (result) {
                for await (const chunk of result) {
                    if (stopAnswer) {
                        yield '{MESSAGE ENDS HERE}';
                        break;
                    }
                    if (JSON.stringify(chunk.ops[0].path).trim().includes("/streamed_output_str/-")) {
                        yield chunk.ops[0].value;
                    } else if (JSON.stringify(chunk.ops[0].path).trim() == '"/final_output"') {
                        this.updateMemory({ input: input, output: chunk.ops[0].value.output })
                        yield 'LAST CHUNK: ' + chunk.ops[0].value.output;
                    } else if (JSON.stringify(chunk.ops[0].path).trim() == '"/streamed_output/-"') {
                        this.updateMemory({ input: input, output: chunk.ops[0].value.output })
                        yield chunk.ops[0].value.output;
                    }

                }
                // yield '{MESSAGE ENDS HERE}';
                if (!stopAnswer) {
                    resolvePromise?.("Processing completed without stop signal");
                }
            }

        } catch (error) {
            console.error(error);
            return error;
        }
    }

    public async updateMemory({ input, output }: { input: string; output: string }) {
        this.memory.saveContext(
            {
                question: input,
            }, {
            answer: output,
        }
        );
    }

    public async getMemoryMessages() {
        const { history } = await this.memory.loadMemoryVariables({});
        return history;
    }

    public async clearMemory() {
        this.memory.clear();
    }

    public async setTools({ tools }: { tools: Array<any> }) {
        this.tools = tools;
    }

    public async getActiveTools() {
        return this.activeTools;
    }

    public async setActiveTools({ activeTools }: { activeTools: Object }) {
        this.activeTools = activeTools;
    }

    public async setPrompt(promptString: string) {
        this.promptString = promptString
        this.prompt = ChatPromptTemplate.fromMessages([
            ["human", promptString],
            ["ai", "Instructions noted! I will do my best to help you."],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
            new MessagesPlaceholder("agent_scratchpad"),
        ]);
    }

    public async setExecutorId(executorId: string) {
        this.executorId = executorId;
    }

    public getPrompt() {
        console.log(this.promptString)
        return this.promptString;
    }

    public async getExecutorId() {
        return this.executorId;
    }

    public async setModel({ modelName }: { modelName: string }) {
        this.modelName = modelName;
        console.log(this.modelName)
    }

    public async getModel() {
        return this.modelName;
    }

    public async initExecutor() {
        const tools = this.tools
        let llm;
        let agent;
        let agentExecutor;
        llm = new ChatOpenAI({ modelName: this.modelName, temperature: 0, streaming: true });
        agent = await createOpenAIFunctionsAgent({
            llm,
            tools,
            prompt: this.prompt,
        });

        agentExecutor = new AgentExecutor({
            agent,
            tools,
            maxIterations: 100
        });

        const messageHistory = new ChatMessageHistory();

        const messages = await this.getMemoryMessages();
        for (let i = 0; i < messages.length; i++) {
            if (i % 2 === 0) {
                messageHistory.addUserMessage(messages[i].lc_kwargs.content)
            } else {
                messageHistory.addAIMessage(messages[i].lc_kwargs.content)
            }
        }

        const agentWithHistory = new RunnableWithMessageHistory({
            runnable: agentExecutor,
            getMessageHistory: (_sessionId) => messageHistory,
            inputMessagesKey: "input",
            historyMessagesKey: "chat_history",
        })

        this.executor = agentWithHistory;
        return this.executor;

    }

    public async getTools() {
        return this.tools;
    }

}