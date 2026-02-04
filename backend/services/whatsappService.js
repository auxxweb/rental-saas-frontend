// WhatsApp service using Twilio API
// You can also use other services like WhatsApp Business API, Twilio, etc.

const twilio = require('twilio');

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
      console.log('Twilio not configured. Skipping WhatsApp message.');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Format phone number (ensure it includes country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const messageResult = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${formattedPhone}`,
      body: message,
    });

    console.log('WhatsApp message sent:', messageResult.sid);
    return { success: true, messageId: messageResult.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

// Send shop credentials via WhatsApp
const sendShopCredentialsWhatsApp = async (phoneNumber, shopData, credentials) => {
  const message = `🎉 Welcome to Rental SaaS Platform!

Your shop has been registered successfully!

📋 Shop Details:
• Shop Name: ${shopData.name}
• Email: ${credentials.email}
• Password: ${credentials.password}

🔗 Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

⚠️ Please change your password after first login for security.

Need help? Contact our support team.

Best regards,
Rental SaaS Platform Team`;

  return await sendWhatsAppMessage(phoneNumber, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendShopCredentialsWhatsApp,
};
