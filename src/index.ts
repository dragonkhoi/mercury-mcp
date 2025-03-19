import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GET_TREASURY_TOOL } from "./tools/accounts/get_treasury.js";
import { GET_BANK_ACCOUNTS_TOOL } from "./tools/accounts/get_bank_accounts.js";
import { GET_BANK_STATEMENTS_TOOL } from "./tools/accounts/statements/get_bank_statements.js";
import { GET_BANK_TRANSACTIONS_TOOL } from "./tools/accounts/transactions/get_bank_transactions.js";
import { GET_BANK_TRANSACTION_BY_ID_TOOL } from "./tools/accounts/transactions/get_bank_transaction_by_id.js";
import { SEND_MONEY_TOOL } from "./tools/accounts/transactions/send_money.js";
import { REQUEST_SEND_MONEY_TOOL } from "./tools/accounts/transactions/request_send_money.js";
import { GET_BANK_ACCOUNT_BY_ID_TOOL } from "./tools/accounts/get_bank_account_by_id.js";
import { GET_CREDIT_CARDS_TOOL } from "./tools/accounts/get_credit_cards.js";
import { GET_PAYMENT_RECIPIENTS_TOOL } from "./tools/recipients/get_payment_recipients.js";
import { ADD_PAYMENT_RECIPIENT_TOOL } from "./tools/recipients/add_payment_recipient.js";

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

// Group tools by category for better organization
const ACCOUNT_TOOLS = [
  GET_BANK_ACCOUNTS_TOOL,
  GET_BANK_ACCOUNT_BY_ID_TOOL,
  GET_CREDIT_CARDS_TOOL,
  GET_TREASURY_TOOL,
];

const TRANSACTION_TOOLS = [
  GET_BANK_TRANSACTIONS_TOOL,
  GET_BANK_TRANSACTION_BY_ID_TOOL,
  SEND_MONEY_TOOL,
  REQUEST_SEND_MONEY_TOOL,
];

const STATEMENT_TOOLS = [
  GET_BANK_STATEMENTS_TOOL,
];

const RECIPIENT_TOOLS = [
  GET_PAYMENT_RECIPIENTS_TOOL,
  ADD_PAYMENT_RECIPIENT_TOOL,
];

// Combine all tools into a single array
const tools = [
  ...ACCOUNT_TOOLS,
  ...TRANSACTION_TOOLS,
  ...STATEMENT_TOOLS,
  ...RECIPIENT_TOOLS,
];

// Register all tools with context
tools.forEach((tool) => {
  const toolWithContext = tool.withContext({
    accessToken: MERCURY_API_KEY
  });
  
  server.tool(
    toolWithContext.name,
    toolWithContext.description,
    toolWithContext.inputSchema,
    toolWithContext.handler
  );
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MERCURY MCP SERVER RUNNING ON STDIO")
}

main().catch((error) => {
  console.error("Fatal error in main(): ", error);
  process.exit(1);
})