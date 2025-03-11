import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "mercury",
    version: "1.0.0"
})

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Please provide a Mercury API key");
  process.exit(1);
}

const MERCURY_API_KEY = process.env.MERCURY_API_KEY || args[0] || "YOUR MERCURY API KEY";

server.tool(
  "get_bank_accounts",
  "Retrieve information about your bank accounts (not including treasury accounts).",
  {
    
  },
  async ({  }) => {
    try {
      // Construct URL with query parameters
      const url = `https://api.mercury.com/api/v1/accounts`;
      
      // Set up request options
      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${MERCURY_API_KEY}`
        }
      };
      
      // Make the API request
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data)
          }
        ]
      };
    } catch (error: unknown) {
      console.error("Error fetching Mercury accounts:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching Mercury accounts: ${errorMessage}`
          }
        ]
      };
    }
  }
)

server.tool(
  "get_transactions",
  "Retrieve incoming and outgoing money transactions for a specific bank account.",
  {
    account_id: z.string().describe("The ID of the bank account to retrieve transactions for."),
    limit: z.number().optional().describe("Limit how many transactions to retrieve (default: 500)"),
    offset: z.number().optional().describe("Number of most recent transactions to omit (default: 0)"),
    status: z.enum(["pending", "sent", "cancelled", "failed"]).optional().describe("Filter transactions by status"),
    start: z.string().optional().describe("Earliest createdAt date to filter for (YYYY-MM-DD or ISO 8601)"),
    end: z.string().optional().describe("Latest createdAt date to filter for (YYYY-MM-DD or ISO 8601)"), 
    search: z.string().optional().describe("Search term to look for in transaction descriptions"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order for transactions based on createdAt date (default: desc)")
  },
  async ({ account_id, limit, offset, status, start, end, search, order }) => {
    try {
      let url = `https://api.mercury.com/api/v1/account/${account_id}/transactions`;
      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${MERCURY_API_KEY}`
        }
      };

      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (offset) queryParams.append("offset", offset.toString());
      if (status) queryParams.append("status", status);
      if (start) queryParams.append("start", start);
      if (end) queryParams.append("end", end);
      if (search) queryParams.append("search", search);
      if (order) queryParams.append("order", order);

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data)
          }
        ]
      };
    } catch (error: unknown) {
      console.error("Error fetching transactions:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching transactions: ${errorMessage}`
          }
        ]
      };
    }
  }
)

server.tool(
  "get_treasury",
  "Retrieve treasury account information from Mercury.",
  {},
  async () => {
    try {
      const url = "https://api.mercury.com/api/v1/treasury";
      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${MERCURY_API_KEY}`
        }
      };

      const response = await fetch(url, options);
      const data = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching treasury information: ${errorMessage}`
          }
        ]
      };
    }
  }
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MERCURY MCP SERVER RUNNING ON STDIO")
}

main().catch((error) => {
  console.error("Fatal error in main(): ", error);
  process.exit(1);
})