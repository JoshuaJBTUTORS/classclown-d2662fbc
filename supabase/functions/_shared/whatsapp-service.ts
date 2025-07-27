export interface WhatsAppMessage {
  phoneNumber: string;
  text: string;
  contentUri?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private apiKey: string;
  private channelId: string;
  private baseUrl = "https://api.wazzup24.com/v3/message";

  constructor() {
    this.apiKey = Deno.env.get("WAZZUP_API_KEY") || "";
    this.channelId = Deno.env.get("WAZZUP_CHANNEL_ID") || "";
    
    if (!this.apiKey || !this.channelId) {
      console.warn("WhatsApp service not configured: missing API key or channel ID");
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.apiKey || !this.channelId) {
      console.warn("WhatsApp service not configured, skipping message");
      return { success: false, error: "WhatsApp service not configured" };
    }

    try {
      const payload = {
        channelId: this.channelId,
        chatId: message.phoneNumber,
        chatType: "whatsapp",
        text: message.text,
        ...(message.contentUri && { contentUri: message.contentUri })
      };

      console.log(`Sending WhatsApp message to ${message.phoneNumber}`);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.status >= 200 && response.status < 300) {
        console.log("WhatsApp message sent successfully:", responseData);
        return { 
          success: true, 
          messageId: responseData.id || responseData.messageId 
        };
      } else {
        console.error(`Failed to send WhatsApp message: ${response.status}`, responseData);
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${responseData.message || response.statusText}` 
        };
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with +44 (UK)
    if (digitsOnly.startsWith('0')) {
      return `+44${digitsOnly.slice(1)}`;
    }
    
    // If it doesn't start with +, add +
    if (!phone.startsWith('+')) {
      return `+${digitsOnly}`;
    }
    
    return phone;
  }
}

export const whatsappService = new WhatsAppService();