import { defineTool, ToolContext } from "../../utils/defineTool.js";
import { v4 as uuidv4 } from "uuid";

// Define the context type for Mercury API
export interface MercuryContext extends ToolContext {
  accessToken: string;
}

interface AddRecipientRequestBody {
  name: string;
  emails: string[];
  defaultPaymentMethod: "ACH" | "Check" | "DomesticWire" | "InternationalWire";
  nickname?: string;
  electronicRoutingInfo?: {
    accountNumber: string;
    routingNumber: string;
    bankName?: string;
    electronicAccountType: "businessChecking" | "businessSavings" | "personalChecking" | "personalSavings";
    address?: {
      address1: string;
      address2?: string;
      city: string;
      region: string;
      postalCode: string;
      country: string; // ISO 3166-1 alpha-2
    };
  };
  domesticWireRoutingInfo?: {
    accountNumber: string;
    routingNumber: string;
    bankName?: string;
    address?: {
      address1: string;
      address2?: string;
      city: string;
      region: string;
      postalCode: string;
      country: string; // ISO 3166-1 alpha-2
    };
  };
  internationalWireRoutingInfo?: {
    iban: string;
    swiftCode: string;
    correspondentInfo?: {
      routingNumber?: string;
      swiftCode?: string;
      bankName?: string;
    };
    bankDetails?: {
      bankName: string;
      cityState: string;
      country: string; // ISO 3166-1 alpha-2
    };
    address?: {
      address1: string;
      address2?: string;
      city: string;
      region: string;
      postalCode: string;
      country: string; // ISO 3166-1 alpha-2
    };
    phoneNumber?: string;
    countrySpecific?: {
      canada?: {
        bankCode: string;
        transitNumber: string;
      };
      australia?: {
        bsbCode: string;
      };
      india?: {
        ifscCode: string;
      };
    };
  };
  checkInfo?: {
    address: {
      address1: string;
      address2?: string;
      city: string;
      region: string;
      postalCode: string;
      country: string; // ISO 3166-1 alpha-2
    };
  };
  [key: string]: any; // Index signature to allow dynamic property access
}

export const ADD_PAYMENT_RECIPIENT_TOOL = defineTool<any, MercuryContext>((z) => ({
  name: "add_payment_recipient",
  description: "Add a new payment recipient to Mercury. You must provide the recipient's name, email(s), and default payment method, along with the appropriate routing information for the chosen payment method.",
  inputSchema: {
    name: z.string().describe("The name of the recipient."),
    emails: z.array(z.string().email()).describe("An array of email addresses for the recipient."),
    default_payment_method: z.enum(["ACH", "Check", "DomesticWire", "InternationalWire"]).describe("The default payment method to use for this recipient."),
    nickname: z.string().optional().describe("An optional nickname for the recipient."),
    
    // ACH/Electronic payment fields
    ach_account_number: z.string().optional().describe("The recipient's account number for ACH transfers."),
    ach_routing_number: z.string().optional().describe("The recipient's routing number for ACH transfers."),
    ach_bank_name: z.string().optional().describe("The recipient's bank name for ACH transfers."),
    ach_account_type: z.enum(["businessChecking", "businessSavings", "personalChecking", "personalSavings"]).optional().describe("The type of account for ACH transfers."),
    
    // Domestic wire fields
    domestic_wire_account_number: z.string().optional().describe("The recipient's account number for domestic wire transfers."),
    domestic_wire_routing_number: z.string().optional().describe("The recipient's routing number for domestic wire transfers."),
    domestic_wire_bank_name: z.string().optional().describe("The recipient's bank name for domestic wire transfers."),
    
    // International wire fields
    international_wire_iban: z.string().optional().describe("The recipient's IBAN for international wire transfers."),
    international_wire_swift_code: z.string().optional().describe("The recipient's SWIFT code for international wire transfers."),
    international_wire_bank_name: z.string().optional().describe("The recipient's bank name for international wire transfers."),
    international_wire_bank_city_state: z.string().optional().describe("The city and state of the recipient's bank for international wire transfers."),
    international_wire_bank_country: z.string().optional().describe("The country of the recipient's bank for international wire transfers (ISO 3166-1 alpha-2 code)."),
    
    // Address fields (can be used for various payment methods)
    address_line1: z.string().optional().describe("The first line of the recipient's address."),
    address_line2: z.string().optional().describe("The second line of the recipient's address."),
    city: z.string().optional().describe("The city of the recipient's address."),
    region: z.string().optional().describe("The state/region of the recipient's address."),
    postal_code: z.string().optional().describe("The postal code of the recipient's address."),
    country: z.string().optional().describe("The country of the recipient's address (ISO 3166-1 alpha-2 code)."),
    
    // Idempotency key
    idempotency_key: z.string().optional().describe("A unique identifier for this request to prevent duplicates. If not provided, a UUID will be generated.")
  },
  handler: async (input, context) => {
    try {
      // Construct URL
      const url = "https://api.mercury.com/api/v1/recipients";
      
      // Generate an idempotency key if one wasn't provided
      const idempotencyKey = input.idempotency_key || uuidv4();
      
      // Set up request body
      const requestBody: AddRecipientRequestBody = {
        name: input.name,
        emails: input.emails,
        defaultPaymentMethod: input.default_payment_method,
        nickname: input.nickname
      };
      
      // Add payment method specific details based on the default payment method
      if (input.default_payment_method === "ACH" && input.ach_account_number && input.ach_routing_number) {
        requestBody.electronicRoutingInfo = {
          accountNumber: input.ach_account_number,
          routingNumber: input.ach_routing_number,
          bankName: input.ach_bank_name,
          electronicAccountType: input.ach_account_type || "businessChecking"
        };
        
        // Add address if provided
        if (input.address_line1) {
          requestBody.electronicRoutingInfo.address = {
            address1: input.address_line1,
            address2: input.address_line2,
            city: input.city || "",
            region: input.region || "",
            postalCode: input.postal_code || "",
            country: input.country || "US"
          };
        }
      }
      
      if (input.default_payment_method === "DomesticWire" && input.domestic_wire_account_number && input.domestic_wire_routing_number) {
        requestBody.domesticWireRoutingInfo = {
          accountNumber: input.domestic_wire_account_number,
          routingNumber: input.domestic_wire_routing_number,
          bankName: input.domestic_wire_bank_name
        };
        
        // Add address if provided
        if (input.address_line1) {
          requestBody.domesticWireRoutingInfo.address = {
            address1: input.address_line1,
            address2: input.address_line2,
            city: input.city || "",
            region: input.region || "",
            postalCode: input.postal_code || "",
            country: input.country || "US"
          };
        }
      }
      
      if (input.default_payment_method === "InternationalWire" && input.international_wire_iban && input.international_wire_swift_code) {
        requestBody.internationalWireRoutingInfo = {
          iban: input.international_wire_iban,
          swiftCode: input.international_wire_swift_code
        };
        
        // Add bank details if provided
        if (input.international_wire_bank_name) {
          requestBody.internationalWireRoutingInfo.bankDetails = {
            bankName: input.international_wire_bank_name,
            cityState: input.international_wire_bank_city_state || "",
            country: input.international_wire_bank_country || ""
          };
        }
        
        // Add address if provided
        if (input.address_line1) {
          requestBody.internationalWireRoutingInfo.address = {
            address1: input.address_line1,
            address2: input.address_line2,
            city: input.city || "",
            region: input.region || "",
            postalCode: input.postal_code || "",
            country: input.country || "US"
          };
        }
      }
      
      if (input.default_payment_method === "Check" && input.address_line1) {
        requestBody.checkInfo = {
          address: {
            address1: input.address_line1,
            address2: input.address_line2,
            city: input.city || "",
            region: input.region || "",
            postalCode: input.postal_code || "",
            country: input.country || "US"
          }
        };
      }
      
      // Remove any undefined nested properties
      Object.keys(requestBody).forEach(key => {
        if (typeof requestBody[key] === 'object' && requestBody[key] !== null) {
          Object.keys(requestBody[key]).forEach(nestedKey => {
            if (requestBody[key][nestedKey] === undefined) {
              delete requestBody[key][nestedKey];
            }
            
            // Handle nested address objects
            if (typeof requestBody[key][nestedKey] === 'object' && requestBody[key][nestedKey] !== null) {
              Object.keys(requestBody[key][nestedKey]).forEach(deepKey => {
                if (requestBody[key][nestedKey][deepKey] === undefined) {
                  delete requestBody[key][nestedKey][deepKey];
                }
              });
            }
          });
        }
        
        // Remove the entire object if it's empty after cleaning
        if (typeof requestBody[key] === 'object' && 
            requestBody[key] !== null && 
            Object.keys(requestBody[key]).length === 0) {
          delete requestBody[key];
        }
        
        // Remove top-level undefined properties
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
          errorMessage = "Permission error: Your API token doesn't have permission to add recipients.";
        } else if (response.status === 409) {
          errorMessage = `The idempotency key ${idempotencyKey} is already in use. This request has already been processed.`;
        } else if (response.status === 400) {
          errorMessage = `Invalid request parameters: ${errorText}`;
        }
        
        console.error("Error adding payment recipient:", errorMessage);
        
        // Return structured error response instead of throwing
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error adding payment recipient: ${errorMessage}`
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
      console.error("Error adding payment recipient:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Return structured error response
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error adding payment recipient: ${errorMessage}`
          }
        ]
      };
    }
  },
}));
