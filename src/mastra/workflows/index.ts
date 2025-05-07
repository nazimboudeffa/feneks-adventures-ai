import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

const llm = openai('gpt-4o');

const agent = new Agent({
  name: 'Drawing Agent',
  model: llm,
  instructions: `
        You are a drawing expert who excels at creating engaging stories. Analyze the character and provide a captivating story.
        You are specialized in french-belgium retro comic style, and your stories are always in the form of a comic strip.
        You create a story with 6 panels.
        `,
});
        
const feneksWorkflow = new Workflow({
  name: "feneks-workflow",
  triggerSchema: z.object({
    inputValue: z.string(),
  }),
});

const characterStep = new Step({
  id: "characterStep",
  outputSchema: z.object({
    character: z.string(),
  }),
  execute: async ({ context }) => {
    const character = context.triggerData.inputValue;
    return { character };
  },
});
 
const storyStep1 = new Step({
  id: "storyStep1",
  outputSchema: z.object({
    story: z.string(),
  }),
  execute: async ({ context }) => {
    const character = context.getStepResult(characterStep)?.character;
    return {
      story: `Once upon a time, there was a character named ${character}.`,
    };
  },
});

const storyStep2 = new Step({
  id: "storyStep2",
  execute: async ({ context, mastra }) => {
    const character = context.getStepResult(characterStep)?.character;
    const prompt = `Based on the following character ${character}, suggest an appropriate story ideas for a comic strip.
      `;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let storyText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      storyText += chunk;
    }

    return {
      story: storyText,
    };
  }
});

feneksWorkflow.step(characterStep).then(storyStep2).commit();

export { feneksWorkflow };