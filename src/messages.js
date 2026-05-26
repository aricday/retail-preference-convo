const OPT_IN_MESSAGE =
  "Aric's Retail ISV Super Store: Reply Y to confirm your subscription to recurring automated promotional msgs. Msg & data rates may apply. Reply STOP to cancel.";

const CATEGORIES_SMS =
  "Choose your favorite categories (e.g., 1, 3) or ALL:\n1. Groceries\n2. Tech\n3. Home/Seasonal\n4. Apparel/Beauty\n5. Business";

const CATEGORIES_RCS_BODY =
  "Tap categories you'd like updates on. Tap Done when finished.";

const CHANNEL_SMS =
  "How would you like to hear from us?\n1. Text (RCS/SMS)\n2. Push Notifications\n3. Email";

const FREQUENCY_SMS =
  "How often would you like to hear from us?\n1. Daily\n2. Weekly\n3. Monthly";

function buildConfirmation(categories, channel, frequency) {
  const categoryNames = categories.map((c) => {
    const map = {
      groceries: "Groceries",
      tech: "Tech",
      home_seasonal: "Home/Seasonal",
      apparel_beauty: "Apparel/Beauty",
      business: "Business",
      other: "Other",
    };
    return map[c] || c;
  });

  const channelMap = { rcs_sms: "Text (RCS/SMS)", push: "Push Notifications", email: "Email" };
  const freqMap = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

  return (
    `You're all set! Here's what we saved:\n` +
    `Categories: ${categoryNames.join(", ")}\n` +
    `Channel: ${channelMap[channel] || channel}\n` +
    `Frequency: ${freqMap[frequency] || frequency}\n\n` +
    `Reply MANAGE anytime to update your preferences. Reply STOP to unsubscribe.`
  );
}

function buildCategoryAck(selected) {
  const map = {
    groceries: "Groceries",
    tech: "Tech",
    home_seasonal: "Home/Seasonal",
    apparel_beauty: "Apparel/Beauty",
    business: "Business",
  };
  const names = selected.map((c) => map[c] || c);
  return `Got it: ${names.join(", ")}. Tap more categories or Done to continue.`;
}

const CATEGORY_MAP = {
  "1": "groceries",
  "2": "tech",
  "3": "home_seasonal",
  "4": "apparel_beauty",
  "5": "business",
  "groceries": "groceries",
  "tech": "tech",
  "home/seasonal": "home_seasonal",
  "home_seasonal": "home_seasonal",
  "home": "home_seasonal",
  "apparel/beauty": "apparel_beauty",
  "apparel_beauty": "apparel_beauty",
  "apparel": "apparel_beauty",
  "beauty": "apparel_beauty",
  "business": "business",
};

const CHANNEL_MAP = {
  "1": "rcs_sms",
  "2": "push",
  "3": "email",
  "rcs/sms": "rcs_sms",
  "rcs": "rcs_sms",
  "sms": "rcs_sms",
  "text": "rcs_sms",
  "text (rcs/sms)": "rcs_sms",
  "push": "push",
  "push notifications": "push",
  "email": "email",
  "rcs_sms": "rcs_sms",
};

const FREQUENCY_MAP = {
  "1": "daily",
  "2": "weekly",
  "3": "monthly",
  "daily": "daily",
  "weekly": "weekly",
  "monthly": "monthly",
};

module.exports = {
  OPT_IN_MESSAGE,
  CATEGORIES_SMS,
  CATEGORIES_RCS_BODY,
  CHANNEL_SMS,
  FREQUENCY_SMS,
  buildConfirmation,
  buildCategoryAck,
  CATEGORY_MAP,
  CHANNEL_MAP,
  FREQUENCY_MAP,
};
