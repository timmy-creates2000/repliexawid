import { GoogleGenAI } from "@google/genai";

// Following SKILL.md instructions for React (Vite)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BusinessConfig {
  userId: string;
  name: string;
  description: string;
  products: Product[];
  negotiationMode: boolean;
  paymentMethod: 'flutterwave' | 'paystack' | 'manual';
  flutterwaveKeys?: {
    publicKey: string;
    secretKey: string;
  };
  paystackKeys?: {
    publicKey: string;
    secretKey: string;
  };
  paymentKeys?: { // Legacy/Current mapping
    publicKey: string;
    secretKey: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
  brandColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  googleClientId?: string;
  composerIp?: string;
  composerApiKey?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  lastPrice: number; // Minimum price for negotiation
  description: string;
  type: 'digital' | 'service' | 'physical';
  link?: string; // For digital products
}

export async function getAgentResponse(
  message: string,
  history: { role: string; parts: string }[],
  config: BusinessConfig
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert AI Sales Agent for "${config.name}".
    Business Description: ${config.description}
    
    Current Products:
    ${config.products.map(p => `- ${p.name}: Original Price ₦${p.price}, Minimum Price ₦${p.lastPrice}. Type: ${p.type}`).join('\n')}
    
    Rules:
    1. Be professional, persuasive, and helpful.
    2. If negotiationMode is ON (${config.negotiationMode}), you can negotiate prices but NEVER go below the "Minimum Price" for any product.
    3. If negotiationMode is OFF, stick to the Original Price.
    4. For digital products, explain the benefits but do NOT send the link yet. Tell them they will receive it after payment confirmation.
    5. If a customer is ready to buy, provide a summary and ask them to confirm. Once confirmed, provide the payment link.
    6. If a customer wants to book a meeting, ask for their preferred time and email.
    7. Use a friendly, conversational tone.
    8. If the user uses voice, keep responses concise and clear.
    9. When providing a payment link:
       - If paymentMethod is "paystack", generate a link like: "https://checkout.paystack.com/[PRODUCT_ID]" (simulated for demo).
       - If paymentMethod is "flutterwave", generate a link like: "https://checkout.flutterwave.com/[PRODUCT_ID]" (simulated for demo).
       - If paymentMethod is "manual", provide the bank details: ${config.bankDetails?.bankName} - ${config.bankDetails?.accountNumber}.
    10. Format payment links as: "You can complete your purchase here: [Payment Link]"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
  }
}
