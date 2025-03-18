import { defineTool, ToolContext } from "../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_TREASURY_TOOL = defineTool<{}, MercuryContext>((z) => ({
  name: "get_treasury",
  description: "Retrieve treasury account information from Mercury.",
  inputSchema: {
    // No input parameters required for this endpoint
  },
  handler: async (input, context) => {
    try {
      const url = "https://api.mercury.com/api/v1/treasury";
      
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
      console.error("Error fetching treasury information:", error);
      throw new Error(`Error fetching treasury information: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
