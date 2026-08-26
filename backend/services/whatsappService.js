class BaseWhatsAppProvider {
  async sendMessage(to, text) {
    throw new Error('sendMessage must be implemented');
  }
}

class DevelopmentWhatsAppProvider extends BaseWhatsAppProvider {
  constructor(config = {}) {
    super();
    this.sender = config.whatsappSenderNumber || 'ANR-Dairy-Dev';
  }

  async sendMessage(to, text) {
    console.log(`\n--- [DEVELOPMENT WHATSAPP PROVIDER DISPATCH] ---`);
    console.log(`From (Sender ID): ${this.sender}`);
    console.log(`To (Farmer Phone): ${to}`);
    console.log(`Message Body:`);
    console.log(`"${text}"`);
    console.log(`------------------------------------------------\n`);
    
    // Simulate brief network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      messageId: `msg_wa_${Math.random().toString(36).substring(2, 11)}`,
      provider: 'development',
      timestamp: new Date()
    };
  }
}

class MetaWhatsAppProvider extends BaseWhatsAppProvider {
  constructor(config = {}) {
    super();
    this.apiUrl = config.whatsappApiUrl;
    this.apiKey = config.whatsappApiKey;
    this.sender = config.whatsappSenderNumber;
  }

  async sendMessage(to, text) {
    // Meta WhatsApp Cloud API endpoint implementation
    // This will be active in v2 production. For now, it throws an error to force fallback or display configuration error.
    throw new Error('Meta WhatsApp Business API Provider is not active in Version 1. Please switch to Development Provider in Settings.');
  }
}

class WhatsAppService {
  getProvider(profile) {
    const providerType = profile?.whatsappProvider || 'development';
    if (providerType === 'meta') {
      return new MetaWhatsAppProvider(profile);
    }
    return new DevelopmentWhatsAppProvider(profile);
  }

  async sendMessage(to, text, profile) {
    const provider = this.getProvider(profile);
    return provider.sendMessage(to, text);
  }
}

module.exports = new WhatsAppService();
