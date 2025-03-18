import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GET_TREASURY_TOOL } from "./tools/accounts/get_treasury.js";
import { GET_BANK_ACCOUNTS_TOOL } from "./tools/accounts/get_bank_accounts.js";
import { GET_BANK_STATEMENTS_TOOL } from "./tools/accounts/statements/get_bank_statements.js";
import { GET_BANK_TRANSACTIONS_TOOL } from "./tools/accounts/transactions/get_bank_transactions.js";
import { GET_BANK_ACCOUNT_BY_ID_TOOL } from "./tools/accounts/get_bank_account_by_id.js";

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

// Register the GET_TREASURY_TOOL with context
const treasuryTool = GET_TREASURY_TOOL.withContext({
  accessToken: MERCURY_API_KEY
});

server.tool(
  treasuryTool.name,
  treasuryTool.description,
  treasuryTool.inputSchema,
  treasuryTool.handler
);

// Register the GET_BANK_ACCOUNTS_TOOL with context
const bankAccountsTool = GET_BANK_ACCOUNTS_TOOL.withContext({
  accessToken: MERCURY_API_KEY
});

server.tool(
  bankAccountsTool.name,
  bankAccountsTool.description,
  bankAccountsTool.inputSchema,
  bankAccountsTool.handler
);

// Register the GET_BANK_ACCOUNT_BY_ID_TOOL with context
const bankAccountByIdTool = GET_BANK_ACCOUNT_BY_ID_TOOL.withContext({
  accessToken: MERCURY_API_KEY
});

server.tool(
  bankAccountByIdTool.name,
  bankAccountByIdTool.description,
  bankAccountByIdTool.inputSchema,
  bankAccountByIdTool.handler
);

// Register the GET_BANK_STATEMENTS_TOOL with context
const bankStatementsTool = GET_BANK_STATEMENTS_TOOL.withContext({
  accessToken: MERCURY_API_KEY
});

server.tool(
  bankStatementsTool.name,
  bankStatementsTool.description,
  bankStatementsTool.inputSchema,
  bankStatementsTool.handler
);

// Register the GET_BANK_TRANSACTIONS_TOOL with context
const bankTransactionsTool = GET_BANK_TRANSACTIONS_TOOL.withContext({
  accessToken: MERCURY_API_KEY
});

server.tool(
  bankTransactionsTool.name,
  bankTransactionsTool.description,
  bankTransactionsTool.inputSchema,
  bankTransactionsTool.handler
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MERCURY MCP SERVER RUNNING ON STDIO")
}

main().catch((error) => {
  console.error("Fatal error in main(): ", error);
  process.exit(1);
})