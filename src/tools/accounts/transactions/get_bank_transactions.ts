import { defineTool, ToolContext } from "../../../utils/defineTool.js";
import { z } from "zod";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_BANK_TRANSACTIONS_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "get_transactions",
  description: "Retrieve incoming and outgoing money transactions for a specific bank account.",
  inputSchema: {
    account_id: z.string().describe("The ID of the bank account to retrieve transactions for."),
    limit: z.number().optional().describe("Limit how many transactions to retrieve (default: 500)"),
    offset: z.number().optional().describe("Number of most recent transactions to omit (default: 0)"),
    status: z.enum(["pending", "sent", "cancelled", "failed"]).optional().describe("Filter transactions by status"),
    start: z.string().optional().describe("Earliest createdAt date to filter for (YYYY-MM-DD or ISO 8601)"),
    end: z.string().optional().describe("Latest createdAt date to filter for (YYYY-MM-DD or ISO 8601)"), 
    search: z.string().optional().describe("Search term to look for in transaction descriptions"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order for transactions based on createdAt date (default: desc)")
  },
  handler: async (input, context) => {
    try {
      let url = `https://api.mercury.com/api/v1/account/${input.account_id}/transactions`;
      
      // Set up request options
      const options = {
        method: "GET",
        headers: {
          "accept": "application/json",
          "authorization": `Bearer ${context.accessToken}`,
        },
      };

      // Add query parameters if provided
      const queryParams = new URLSearchParams();
      if (input.limit) queryParams.append("limit", input.limit.toString());
      if (input.offset) queryParams.append("offset", input.offset.toString());
      if (input.status) queryParams.append("status", input.status);
      if (input.start) queryParams.append("start", input.start);
      if (input.end) queryParams.append("end", input.end);
      if (input.search) queryParams.append("search", input.search);
      if (input.order) queryParams.append("order", input.order);

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      // Make the API request
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error(`Error fetching transactions: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}));
