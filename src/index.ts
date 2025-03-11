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
  "get_all_accounts",
  "Retrieve information about all your bank accounts.",
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
    account_id: z.string().describe("The ID of the bank account to retrieve transactions for.")
  },
  async ({ account_id }) => {
    try {
      const url = `https://api.mercury.com/api/v1/account/${account_id}/transactions`;
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MERCURY MCP SERVER RUNNING ON STDIO")
}

main().catch((error) => {
  console.error("Fatal error in main(): ", error);
  process.exit(1);
})