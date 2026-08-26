class BaseSMSProvider {
  async sendSMS(to, text) {
    throw new Error('sendSMS must be implemented');
  }
}

class DevelopmentSMSProvider extends BaseSMSProvider {
  constructor(config = {}) {
    super();
    this.senderId = config.smsSenderId || 'ANR-SMS-Dev';
  }

  async sendSMS(to, text) {
    console.log(`\n--- [DEVELOPMENT SMS PROVIDER DISPATCH] ---`);
    console.log(`From (Sender ID): ${this.senderId}`);
    console.log(`To (Farmer Phone): ${to}`);
    console.log(`Message Body:`);
    console.log(`"${text}"`);
    console.log(`-------------------------------------------\n`);

    // Simulate brief network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      messageId: `msg_sms_${Math.random().toString(36).substring(2, 11)}`,
      provider: 'development',
      timestamp: new Date()
    };
  }
}

class TwilioSMSProvider extends BaseSMSProvider {
  constructor(config = {}) {
    super();
    this.apiUrl = config.smsApiUrl;
    this.apiKey = config.smsApiKey;
    this.senderId = config.smsSenderId;
  }

  async sendSMS(to, text) {
    // Twilio SMS API implementation placeholder
    throw new Error('Twilio SMS Provider is not active in Version 1. Please switch to Development Provider in Settings.');
  }
}

class SMSService {
  getProvider(profile) {
    const providerType = profile?.smsProvider || 'development';
    if (providerType === 'twilio') {
      return new TwilioSMSProvider(profile);
    }
    return new DevelopmentSMSProvider(profile);
  }

  async sendSMS(to, text, profile) {
    const provider = this.getProvider(profile);
    return provider.sendSMS(to, text);
  }
}

module.exports = new SMSService();
