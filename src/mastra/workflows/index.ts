import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

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
 
const storyStep = new Step({
  id: "storyStep",
  execute: async ({ context }) => {
    const character = context.getStepResult(characterStep)?.character;
    return {
      story: `Once upon a time, there was a character named ${character}.`,
    };
  },
});

feneksWorkflow.step(characterStep).then(storyStep).commit();

export { feneksWorkflow };