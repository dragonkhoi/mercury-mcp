import { defineTool, ToolContext } from "../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_BANK_ACCOUNTS_TOOL = defineTool<{}, MercuryContext>((z) => ({
  name: "get_bank_accounts",
  description: "Retrieve information about your bank accounts (not including treasury accounts).",
  inputSchema: {
    // No input parameters required for this endpoint
  },
  handler: async (input, context) => {
    try {
      // Construct URL with query parameters
      const url = "https://api.mercury.com/api/v1/accounts";
      
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
      console.error("Error fetching Mercury accounts:", error);
      throw new Error(`Error fetching Mercury accounts: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
