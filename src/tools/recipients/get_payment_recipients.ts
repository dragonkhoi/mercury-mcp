import { defineTool, ToolContext } from "../../utils/defineTool.js";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

export const GET_PAYMENT_RECIPIENTS_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "get_payment_recipients",
  description: "Retrieve information about all of your payment recipients in Mercury, including their banking details, routing information, payment methods, and status.",
  inputSchema: {
    // No input parameters required for this endpoint
  },
  handler: async (input, context) => {
    try {
      // Construct URL
      const url = "https://api.mercury.com/api/v1/recipients";
      
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
        let errorMessage = `HTTP error! status: ${response.status} - ${errorText}`;
        
        // Handle common error cases
        if (response.status === 401) {
          errorMessage = "Authentication error: Invalid or expired API token. Check your API token permissions.";
        } else if (response.status === 403) {
          errorMessage = "Permission error: Your API token doesn't have access to recipient information.";
        }
        
        console.error("Error fetching payment recipients:", errorMessage);
        
        // Return structured error response instead of throwing
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error fetching payment recipients: ${errorMessage}`
            }
          ]
        };
      }
      
      const data = await response.json();
      
      // Return formatted content array response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data)
          }
        ]
      };
    } catch (error) {
      console.error("Error fetching payment recipients:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Return structured error response
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error fetching payment recipients: ${errorMessage}`
          }
        ]
      };
    }
  },
}));
