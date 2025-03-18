import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type InferToolHandlerInput<TInputSchema extends z.ZodRawShape> =
  z.objectOutputType<TInputSchema, z.ZodTypeAny>;

// Define a context type that can be extended by users
export type ToolContext = Record<string, any>;

type ToolDefinition<TInputSchema extends z.ZodRawShape, TContext extends ToolContext> = {
  name: string;
  description: string;
  inputSchema: TInputSchema;
  handler: (
    input: InferToolHandlerInput<TInputSchema>,
    context: TContext
  ) => Promise<Record<string, unknown>>;
};

export const defineTool = <TInputSchema extends z.ZodRawShape, TContext extends ToolContext = ToolContext>(
  cb: (zod: typeof z) => ToolDefinition<TInputSchema, TContext>
) => {
  const tool = cb(z);

  const wrappedHandler = async (
    input: InferToolHandlerInput<TInputSchema>,
    extra: RequestHandlerExtra,
    context: TContext
  ): Promise<CallToolResult> => {
    try {
      const result = await tool.handler(input, context);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  };

  return {
    ...tool,
    handler: (input: InferToolHandlerInput<TInputSchema>, extra: RequestHandlerExtra) => 
      wrappedHandler(input, extra, {} as TContext),
    withContext: (context: TContext) => ({
      ...tool,
      handler: (input: InferToolHandlerInput<TInputSchema>, extra: RequestHandlerExtra) => 
        wrappedHandler(input, extra, context),
    }),
  };
};
