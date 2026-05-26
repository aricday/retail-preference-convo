const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendMessage(to, body) {
  const message = await client.messages.create({
    messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    to,
    body,
  });
  return message;
}

async function sendTemplate(to, contentSid, contentVariables) {
  const params = {
    messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    to,
    contentSid,
  };
  if (contentVariables) {
    params.contentVariables = JSON.stringify(contentVariables);
  }
  const message = await client.messages.create(params);
  return message;
}

module.exports = { sendMessage, sendTemplate };
