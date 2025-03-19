import { defineTool, ToolContext } from "../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_CREDIT_CARDS_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "get_credit_cards",
  description: "Retrieve information about cards associated with a specific account. Note that status and physical card status are two separate concepts. Either one being set to something other than \"active\" could cause a transaction to be declined.",
  inputSchema: {
    id: z.string().describe("Your 36-character account UUID.")
  },
  handler: async (input, context) => {
    try {
      // Construct URL with account ID
      const url = `https://api.mercury.com/api/v1/account/${input.id}/cards`;
      
      // Set up request options
      const options = {
        method: "GET",
        headers: {
          "accept": "application/json",
          "authorization": `Bearer ${context.accessToken}`,
        },
      };
      
      // Make the API request
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching credit cards:", error);
      throw new Error(`Error fetching credit cards: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
