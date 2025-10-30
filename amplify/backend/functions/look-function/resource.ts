import { defineFunction } from "@aws-amplify/backend";

export const lookFunction = defineFunction({
  name: "look-function",
  entry: "./handler.ts",
  timeoutSeconds: 900,
  memoryMB: 2048,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  },
  
});
