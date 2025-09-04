AI Agents

Building AI Agents with Convex

Convex provides powerful building blocks for building agentic AI applications, leveraging Components and existing Convex features.

With Convex, you can separate your long-running agentic workflows from your UI, without the user losing reactivity and interactivity. The message history with an LLM is persisted by default, live updating on every client, and easily composed with other Convex features using code rather than configuration.

Agent Component

The Agent component is a core building block for building AI agents. It manages threads and messages, around which your Agents can cooperate in static or dynamic workflows.

Agent Component YouTube Video

Core Concepts

Agents organize LLM prompting with associated models, prompts, and Tools. They can generate and stream both text and objects.
Agents can be used in any Convex action, letting you write your agentic code alongside your other business logic with all the abstraction benefits of using code rather than static configuration.
Threads persist messages and can be shared by multiple users and agents (including human agents).
Conversation context is automatically included in each LLM call, including built-in hybrid vector/text search for messages.
Advanced Features

Workflows allow building multi-step operations that can span agents, users, durably and reliably.
RAG techniques are also supported for prompt augmentation either up front or as tool calls using the RAG Component.
Files can be used in the chat history with automatic saving to file storage.
Debugging and Tracking

Debugging is supported, including the agent playground where you can inspect all metadata and iterate on prompts and context settings.
Usage tracking enables usage billing for users and teams.
Rate limiting helps control the rate at which users can interact with agents and keep you from exceeding your LLM provider's limits.
Build your first Agent
Learn more about the motivation by reading: AI Agents with Built-in Memory.

Sample code:

import { Agent } from "@convex-dev/agents";
import { openai } from "@ai-sdk/openai";
import { components } from "./\_generated/api";
import { action } from "./\_generated/server";

// Define an agent
const supportAgent = new Agent(components.agent, {
name: "Support Agent",
chat: openai.chat("gpt-4o-mini"),
instructions: "You are a helpful assistant.",
tools: { accountLookup, fileTicket, sendEmail },
});

// Use the agent from within a normal action:
export const createThread = action({
args: { prompt: v.string() },
handler: async (ctx, { prompt }) => {
const { threadId, thread } = await supportAgent.createThread(ctx);
const result = await thread.generateText({ prompt });
return { threadId, text: result.text };
},
});

// Pick up where you left off, with the same or a different agent:
export const continueThread = action({
args: { prompt: v.string(), threadId: v.string() },
handler: async (ctx, { prompt, threadId }) => {
// This includes previous message history from the thread automatically.
const { thread } = await anotherAgent.continueThread(ctx, { threadId });
const result = await thread.generateText({ prompt });
return result.text;
},
});

Getting Started with Agent

To install the agent component, you'll need an existing Convex project. New to Convex? Go through the tutorial.

Run npm create convex or follow any of the quickstarts to set one up.

Installation

Install the component package:

npm install @convex-dev/agent

Create a convex.config.ts file in your app's convex/ folder and install the component by calling use:

// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);

export default app;

Then run npx convex dev to generate code for the component. This needs to successfully run once before you start defining Agents.

Defining your first Agent

import { components } from "./\_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
name: "My Agent",
languageModel: openai.chat("gpt-4o-mini"),
});

Using it:

import { action } from "./\_generated/server";
import { v } from "convex/values";

export const helloWorld = action({
args: { prompt: v.string() },
handler: async (ctx, { prompt }) => {
const threadId = await createThread(ctx, components.agent);
const result = await agent.generateText(ctx, { threadId }, { prompt });
return result.text;
},
});

If you get type errors about components.agent, ensure you've run npx convex dev to generate code for the component.

That's it! Next check out creating Threads and Messages.

Customizing the agent

The agent by default only needs a chat model to be configured. However, for vector search, you'll need a textEmbeddingModel model. A name is helpful to attribute each message to a specific agent. Other options are defaults that can be over-ridden at each LLM call-site.

import { tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v3";
import { Agent, createTool, type Config } from "@convex-dev/agent";
import { components } from "./\_generated/api";

const sharedDefaults = {
// The chat completions model to use for the agent.
languageModel: openai.chat("gpt-4o-mini"),
// Embedding model to power vector search of message history (RAG).
textEmbeddingModel: openai.embedding("text-embedding-3-small"),
// Used for fetching context messages. See https://docs.convex.dev/agents/context
contextOptions,
// Used for storing messages. See https://docs.convex.dev/agents/messages
storageOptions,
// Used for tracking token usage. See https://docs.convex.dev/agents/usage-tracking
usageHandler: async (ctx, args) => {
const { usage, model, provider, agentName, threadId, userId } = args;
// ... log, save usage to your database, etc.
},
// Useful if you want to log or record every request and response.
rawResponseHandler: async (ctx, args) => {
const { request, response, agentName, threadId, userId } = args;
// ... log, save request/response to your database, etc.
},
// Used for limiting the number of retries when a tool call fails. Default: 3.
callSettings: { maxRetries: 3, temperature: 1.0 },
// Used for setting default provider-specific options to the LLM calls.
providerOptions: { openai: { cacheControl: { type: "ephemeral" } } },
} satisfies Config;

// Define an agent similarly to the AI SDK
const supportAgent = new Agent(components.agent, {
// The default system prompt if not over-ridden.
instructions: "You are a helpful assistant.",
tools: {
// Convex tool
myConvexTool: createTool({
description: "My Convex tool",
args: z.object({...}),
// Note: annotate the return type of the handler to avoid type cycles.
handler: async (ctx, args): Promise<string> => {
return "Hello, world!";
},
}),
// Standard AI SDK tool
myTool: tool({ description, parameters, execute: () => {}}),
},
// Used for limiting the number of steps when tool calls are involved.
// NOTE: if you want tool calls to happen automatically with a single call,
// you need to set this to something greater than 1 (the default).
stopWhen: stepCountIs(5),
...sharedDefaults,
});
