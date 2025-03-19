import { defineTool, ToolContext } from "../../../utils/defineTool.js";
import { v4 as uuidv4 } from "uuid";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

interface TransactionRequestBody {
  recipientId: string;
  amount: number;
  note?: string;
  externalMemo?: string;
  [key: string]: any; // Index signature to allow dynamic property access
}

export const SEND_MONEY_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "send_money",
  description: "Create a new transaction for ACH payments. Note: This tool requires additional permissions and IP whitelisting with Mercury, so ask the user to clarify if they have whitelisted their IP first. If they have not, use the request_send_money tool instead. Only use for valid purposes like paying invoices or automating bill payments.",
  inputSchema: {
    account_id: z.string().describe("The 36-character account UUID to send money from."),
    recipient_id: z.string().describe("The recipient ID to send money to."),
    amount: z.number().positive().describe("The amount to send in USD (positive number)."),
    note: z.string().optional().describe("An optional internal note for the transaction (not visible to the recipient)."),
    external_memo: z.string().optional().describe("An optional memo to be included with the transaction (visible to the recipient)."),
    idempotency_key: z.string().optional().describe("A unique identifier for this transaction request to prevent duplicates. If not provided, a UUID will be generated.")
  },
  handler: async (input, context) => {
    try {
      // Construct URL with account ID
      const url = `https://api.mercury.com/api/v1/account/${input.account_id}/transactions`;
      
      // Generate an idempotency key if one wasn't provided
      const idempotencyKey = input.idempotency_key || uuidv4();
      
      // Set up request body
      const requestBody: TransactionRequestBody = {
        recipientId: input.recipient_id,
        amount: input.amount,
        note: input.note,
        externalMemo: input.external_memo
      };
      
      // Remove undefined properties
      Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });
      
      // Set up request options
      const options = {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": `Bearer ${context.accessToken}`,
          "idempotency-key": idempotencyKey
        },
        body: JSON.stringify(requestBody)
      };
      
      // Make the API request
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status} - ${errorText}`;
        
        // if error code is 409, explain that the idempotency key is already in use and there is a conflict
        if (response.status === 409) {
          errorMessage = `The idempotency key ${idempotencyKey} is already in use and there is a conflict. Please use a different idempotency key.`;
        }
        // if error code is 403, explain that Mercury requires a whitelist and to go to https://app.mercury.com/settings/tokens to white list the IP
        else if (response.status === 403) {
          errorMessage = `Mercury requires a whitelisted IP for this tool. Please go to https://app.mercury.com/settings/tokens to whitelist your IP. Please add the IP to the whitelist and try again.`;
        }
        else if (response.status === 401) {
          errorMessage = "Authentication error: Invalid or expired API token. Check your API token permissions.";
        }
        
        console.error("Error sending money:", errorMessage);
        
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error sending money: ${errorMessage}`
            }
          ]
        };
      }
      
      const data = await response.json();
      const result = {
        ...data,
        idempotency_key: idempotencyKey // Include the idempotency key for reference
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      console.error("Error sending money:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error sending money: ${errorMessage}`
          }
        ]
      };
    }
  },
}));
