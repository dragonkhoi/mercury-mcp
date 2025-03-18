import { defineTool, ToolContext } from "../../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_BANK_STATEMENTS_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "get_bank_statements",
  description: "Retrieve statement information for a depository account in a given time period (Note: For now, treasury and credit accounts are not supported on this endpoint).",
  inputSchema: {
    account_id: z.string().describe("Your 36-character account UUID."),
    start: z.string().optional().describe("Filter the statements so that their startDate is equal to or later than this date. Format: YYYY-MM-DD."),
    end: z.string().optional().describe("Filter the statements so that their endDate is less than or equal to this date. Format: YYYY-MM-DD.")
  },
  handler: async (input, context) => {
    try {
      // Construct base URL
      let url = `https://api.mercury.com/api/v1/account/${input.account_id}/statements`;
      
      // Add query parameters if provided
      const queryParams = new URLSearchParams();
      if (input.start) queryParams.append("start", input.start);
      if (input.end) queryParams.append("end", input.end);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
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
      console.error("Error fetching bank statements:", error);
      throw new Error(`Error fetching bank statements: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
