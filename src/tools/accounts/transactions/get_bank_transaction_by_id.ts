import { defineTool, ToolContext } from "../../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_BANK_TRANSACTION_BY_ID_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "get_bank_transaction_by_id",
  description: "Retrieve detailed information about a specific transaction for a specific account, including counterparty information, transaction status, and any attachments.",
  inputSchema: {
    account_id: z.string().describe("The 36-character account UUID."),
    transaction_id: z.string().describe("The ID of the specific transaction to retrieve details for.")
  },
  handler: async (input, context) => {
    try {
      // Construct URL with account ID and transaction ID
      const url = `https://api.mercury.com/api/v1/account/${input.account_id}/transaction/${input.transaction_id}`;
      
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
      console.error("Error fetching transaction details:", error);
      throw new Error(`Error fetching transaction details: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
