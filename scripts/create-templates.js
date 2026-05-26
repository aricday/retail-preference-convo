require("dotenv").config();
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function createTemplates() {
  console.log("====================================");
  console.log("CREATING CONTENT TEMPLATES");
  console.log("====================================");

  const templates = {};

  // Template 1: Category Selection Card
  console.log("\n=== Template 1: Category Selection ===");
  const categoryTemplate = await client.content.v1.contents.create({
    friendlyName: "arics-retail-category-selection",
    language: "en",
    types: {
      "twilio/card": {
        title: "What interests you?",
        body: "Tap categories you'd like updates on. Tap Done when finished.",
        actions: [
          { type: "QUICK_REPLY", title: "Groceries", id: "groceries" },
          { type: "QUICK_REPLY", title: "Tech", id: "tech" },
          { type: "QUICK_REPLY", title: "Home/Seasonal", id: "home_seasonal" },
          { type: "QUICK_REPLY", title: "Apparel/Beauty", id: "apparel_beauty" },
          { type: "QUICK_REPLY", title: "Business", id: "business" },
          { type: "QUICK_REPLY", title: "All", id: "all" },
          { type: "QUICK_REPLY", title: "Done", id: "done" },
        ],
      },
      "twilio/text": {
        body: "Choose your favorite categories (e.g., 1, 3) or ALL:\n1. Groceries\n2. Tech\n3. Home/Seasonal\n4. Apparel/Beauty\n5. Business",
      },
    },
  });
  templates.category = categoryTemplate.sid;
  console.log(`Category Template SID: ${categoryTemplate.sid}`);

  // Template 2: Category Acknowledgment (for RCS multi-select flow)
  console.log("\n=== Template 2: Category Acknowledgment ===");
  const categoryAckTemplate = await client.content.v1.contents.create({
    friendlyName: "arics-retail-category-ack",
    language: "en",
    types: {
      "twilio/card": {
        title: "Great choice!",
        body: "{{1}} Tap more categories or Done to continue.",
        actions: [
          { type: "QUICK_REPLY", title: "Groceries", id: "groceries" },
          { type: "QUICK_REPLY", title: "Tech", id: "tech" },
          { type: "QUICK_REPLY", title: "Home/Seasonal", id: "home_seasonal" },
          { type: "QUICK_REPLY", title: "Apparel/Beauty", id: "apparel_beauty" },
          { type: "QUICK_REPLY", title: "Business", id: "business" },
          { type: "QUICK_REPLY", title: "Done", id: "done" },
        ],
      },
      "twilio/text": {
        body: "{{1}} Tap more categories or Done to continue.",
      },
    },
  });
  templates.categoryAck = categoryAckTemplate.sid;
  console.log(`Category Ack Template SID: ${categoryAckTemplate.sid}`);

  // Template 3: Channel Preference
  console.log("\n=== Template 3: Channel Preference ===");
  const channelTemplate = await client.content.v1.contents.create({
    friendlyName: "arics-retail-channel-preference",
    language: "en",
    types: {
      "twilio/quick-reply": {
        body: "How would you like to hear from us?",
        actions: [
          { type: "QUICK_REPLY", title: "Text (RCS/SMS)", id: "rcs_sms" },
          { type: "QUICK_REPLY", title: "Push Notifications", id: "push" },
          { type: "QUICK_REPLY", title: "Email", id: "email" },
        ],
      },
      "twilio/text": {
        body: "How would you like to hear from us?\n1. Text (RCS/SMS)\n2. Push Notifications\n3. Email",
      },
    },
  });
  templates.channel = channelTemplate.sid;
  console.log(`Channel Template SID: ${channelTemplate.sid}`);

  // Template 4: Frequency
  console.log("\n=== Template 4: Frequency ===");
  const frequencyTemplate = await client.content.v1.contents.create({
    friendlyName: "arics-retail-frequency",
    language: "en",
    types: {
      "twilio/quick-reply": {
        body: "How often would you like to hear from us?",
        actions: [
          { type: "QUICK_REPLY", title: "Daily", id: "daily" },
          { type: "QUICK_REPLY", title: "Weekly", id: "weekly" },
          { type: "QUICK_REPLY", title: "Monthly", id: "monthly" },
        ],
      },
      "twilio/text": {
        body: "How often would you like to hear from us?\n1. Daily\n2. Weekly\n3. Monthly",
      },
    },
  });
  templates.frequency = frequencyTemplate.sid;
  console.log(`Frequency Template SID: ${frequencyTemplate.sid}`);

  console.log("\n====================================");
  console.log("TEMPLATES CREATED - Update your .env:");
  console.log("====================================");
  console.log(`CONTENT_SID_CATEGORIES=${templates.category}`);
  console.log(`CONTENT_SID_CATEGORIES_ACK=${templates.categoryAck}`);
  console.log(`CONTENT_SID_CHANNEL=${templates.channel}`);
  console.log(`CONTENT_SID_FREQUENCY=${templates.frequency}`);
}

createTemplates().catch((err) => {
  console.error("Template creation failed:", err.message);
  process.exit(1);
});
