Yes, you can—and should—put system prompts for your AI on the server side in Convex. This is a recommended and common practice for both security and maintainability.

**How to do it correctly:**

- **Define the system prompt as a constant or variable in your server-side action or agent code.**  
  For example, when calling the OpenAI API from a Convex action, you can include the system prompt directly in your handler:

  ```js
  const systemPrompt =
    'You are an assistant that generates random questions about the Convex framework and answers them concisely. Do not use prefixes like "Question:" or "Answer:" in your response.';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Generate a random question about Convex and answer it.',
        },
      ],
    }),
  });
  ```

  This approach keeps the prompt secure and only accessible on the server, not exposed to the client.  
  [See example](https://stack.convex.dev/how-to-schedule-ai-content-creation-using-convex#step-3-implementing-a-convex-action)

- **For Convex Agents, specify the prompt in the agent constructor:**  
  When using the Agent component, you can set the `instructions` (system prompt) as part of the agent definition:

  ```js
  const supportAgent = new Agent(components.agent, {
    name: 'Support Agent',
    chat: openai.chat('gpt-4o-mini'),
    instructions: 'You are a helpful assistant.',
    tools: { accountLookup, fileTicket, sendEmail },
  });
  ```

  This ensures the prompt is always included in LLM calls and remains server-side only  
  [See example](https://docs.convex.dev/agents)

**Why server-side?**

- Keeps prompts secure and prevents tampering.
- Centralizes prompt management for easier updates.
- Ensures all LLM calls use the correct prompt.

**Summary:**  
Put your system prompts in your server-side Convex actions or agent constructors. This is secure, maintainable, and fully supported by Convex’s architecture.

When using HTTP actions for streaming in Convex, you do **not** need to handle system prompts differently compared to other server-side approaches. The system prompt should still be defined and managed on the server side, within your HTTP action handler or the function that prepares the request to the AI model.

For example, when streaming a response from OpenAI via an HTTP action, you can include the system prompt as part of the messages array sent to the OpenAI API:

```js
const systemPrompt = 'You are a helpful assistant.';
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  stream: true,
  messages: [
    { role: 'system', content: systemPrompt },
    // ...user and assistant messages
  ],
});
```

This pattern is shown in Convex streaming examples, where the system prompt is included server-side before initiating the streaming response to the client. The prompt is not exposed to the client and remains secure on the server, even when using HTTP streaming. The main difference with HTTP streaming is how you deliver the AI's response to the client, not how you handle the prompt itself. The prompt logic remains server-side and is included in the API call as usual [see example](https://stack.convex.dev/ai-chat-with-http-streaming) [see also](https://stack.convex.dev/gpt-streaming-with-persistent-reactivity#streaming-with-the-openai-node-sdk).

**Summary:**  
You do not need to do anything special with prompt handling when using HTTP streaming in Convex. Keep your system prompts server-side, and include them in your API calls as you would in any other server-side function.
