import { defineTool, ToolContext } from "../../../utils/defineTool.js";
import { v4 as uuidv4 } from "uuid";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

interface RequestSendMoneyRequestBody {
  recipientId: string;
  amount: number;
  memo?: string;
  paymentMethod?: string;
  [key: string]: any; // Index signature to allow dynamic property access
}

export const REQUEST_SEND_MONEY_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "request_send_money",
  description: "Create an ACH payment that requires admin approval from the Mercury web interface. Unlike the direct send_money tool, this endpoint does not require IP whitelisting when using a Custom token, so ask the user to clarify if they have whitelisted their IP.",
  inputSchema: {
    account_id: z.string().describe("The 36-character account UUID to send money from."),
    recipient_id: z.string().describe("The recipient ID to send money to."),
    amount: z.number().positive().describe("The amount to send in USD (positive number)."),
    memo: z.string().optional().describe("An optional memo to be included with the transaction (visible to the recipient)."),
    payment_method: z.string().optional().describe("The payment method to use. Default is ACH."),
    idempotency_key: z.string().optional().describe("A unique identifier for this transaction request to prevent duplicates. If not provided, a UUID will be generated.")
  },
  handler: async (input, context) => {
    try {
      // Construct URL with account ID
      const url = `https://api.mercury.com/api/v1/account/${input.account_id}/request-send-money`;
      
      // Generate an idempotency key if one wasn't provided
      const idempotencyKey = input.idempotency_key || uuidv4();
      
      // Set up request body
      const requestBody: RequestSendMoneyRequestBody = {
        recipientId: input.recipient_id,
        amount: input.amount,
        memo: input.memo,
        paymentMethod: input.payment_method
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
        
        // Handle common error cases
        if (response.status === 401) {
          errorMessage = "Authentication error: Invalid or expired API token. Check your API token permissions.";
        } else if (response.status === 403) {
          errorMessage = "Permission error: Your API token doesn't have the 'Send Money with Approval' scope.";
        } else if (response.status === 409) {
          errorMessage = `The idempotency key ${idempotencyKey} is already in use. This request has already been processed.`;
        } else if (response.status === 400) {
          errorMessage = `Invalid request parameters: ${errorText}`;
        }
        
        console.error("Error requesting to send money:", errorMessage);
        
        // Return structured error response instead of throwing
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error requesting to send money: ${errorMessage}`
            }
          ]
        };
      }
      
      const data = await response.json();
      const result = {
        ...data,
        idempotency_key: idempotencyKey // Include the idempotency key for reference
      };
      
      // Return formatted content array response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      console.error("Error requesting to send money:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Return structured error response
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error requesting to send money: ${errorMessage}`
          }
        ]
      };
    }
  },
}));
