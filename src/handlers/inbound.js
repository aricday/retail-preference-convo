const { STEPS, getSession, createSession, updateSession } = require("../state");
const { sendMessage, sendTemplate } = require("../send");
const { lookupProfile } = require("../memory-client");
const {
  OPT_IN_MESSAGE,
  CATEGORIES_SMS,
  CHANNEL_SMS,
  FREQUENCY_SMS,
  buildConfirmation,
  buildCategoryAck,
  CATEGORY_MAP,
  CHANNEL_MAP,
  FREQUENCY_MAP,
} = require("../messages");
const { savePreferences } = require("../memory-client");

async function handleInbound(req, res) {
  const rawFrom = req.body.From;
  const channel = rawFrom?.startsWith("rcs:") ? "rcs" : "sms";
  const from = rawFrom.replace(/^rcs:/, "");
  const body = (req.body.Body || "").trim();

  console.log(`[INBOUND] From: ${rawFrom} (normalized: ${from}) | Body: "${body}" | Channel: ${channel}`);

  res.status(200).type("text/xml").send("<Response></Response>");

  const replyTo = rawFrom;
  const normalized = body.toLowerCase();

  if (normalized === "join" || normalized === "manage") {
    await handleJoinManage(from, replyTo, normalized, channel);
    return;
  }

  const session = getSession(from);
  if (!session) {
    return;
  }

  switch (session.step) {
    case STEPS.OPT_IN:
      await handleOptIn(from, replyTo, body, channel, session);
      break;
    case STEPS.CATEGORIES:
      await handleCategories(from, replyTo, body, channel, session);
      break;
    case STEPS.CHANNEL:
      await handleChannel(from, replyTo, body, session);
      break;
    case STEPS.FREQUENCY:
      await handleFrequency(from, replyTo, body, session);
      break;
  }
}

async function handleJoinManage(from, replyTo, keyword, channel) {
  const existingProfile = await lookupProfile(from);
  const isReturning = existingProfile !== null && keyword === "manage";

  const session = createSession(from, isReturning);
  updateSession(from, { replyTo, channel });

  if (isReturning) {
    await sendCategoryPrompt(replyTo);
  } else {
    await sendTemplate(replyTo, process.env.CONTENT_SID_OPT_IN);
  }
}

async function handleOptIn(from, replyTo, body, channel, session) {
  const lower = body.toLowerCase();
  if (lower !== "y" && lower !== "y - subscribe") {
    return;
  }

  updateSession(from, {
    step: STEPS.CATEGORIES,
    optInTimestamp: new Date().toISOString(),
    optInChannel: channel,
    optInMessageBody: body,
    replyTo,
    channel,
  });

  await sendCategoryPrompt(replyTo);
}

async function handleCategories(from, replyTo, body, channel, session) {
  const normalized = body.toLowerCase().trim();

  if (normalized === "done") {
    if (session.categories.length === 0) {
      await sendMessage(replyTo, "Please select at least one category before continuing.");
      await sendCategoryPrompt(replyTo);
      return;
    }
    updateSession(from, { step: STEPS.CHANNEL });
    await sendChannelPrompt(replyTo);
    return;
  }

  if (normalized === "all" || normalized === "everything") {
    updateSession(from, {
      categories: ["groceries", "tech", "home_seasonal", "apparel_beauty", "business"],
      step: STEPS.CHANNEL,
    });
    await sendChannelPrompt(replyTo);
    return;
  }

  const parts = normalized.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  const matched = [];
  let hasUnmatched = false;

  for (const part of parts) {
    const mapped = CATEGORY_MAP[part];
    if (mapped && !session.categories.includes(mapped)) {
      matched.push(mapped);
    } else if (!mapped) {
      hasUnmatched = true;
    }
  }

  if (matched.length > 0) {
    const updated = [...session.categories, ...matched];
    updateSession(from, { categories: updated });

    if (channel === "rcs") {
      const ackText = buildCategoryAck(updated);
      await sendTemplate(replyTo, process.env.CONTENT_SID_CATEGORIES_ACK, { "1": ackText });
    } else {
      updateSession(from, { step: STEPS.CHANNEL });
      await sendChannelPrompt(replyTo);
    }
    return;
  }

  if (hasUnmatched || matched.length === 0) {
    updateSession(from, { awaitingNlp: true });
    console.log(`[NLP] Awaiting Intelligence result for: "${body}"`);
  }
}

async function handleChannel(from, replyTo, body, session) {
  const normalized = body.toLowerCase().trim();
  const mapped = CHANNEL_MAP[normalized];

  if (!mapped) {
    await sendMessage(replyTo, "Please choose a valid option.");
    await sendChannelPrompt(replyTo);
    return;
  }

  updateSession(from, { channelPreference: mapped, step: STEPS.FREQUENCY });
  await sendFrequencyPrompt(replyTo);
}

async function handleFrequency(from, replyTo, body, session) {
  const normalized = body.toLowerCase().trim();
  const mapped = FREQUENCY_MAP[normalized];

  if (!mapped) {
    await sendMessage(replyTo, "Please choose a valid option.");
    await sendFrequencyPrompt(replyTo);
    return;
  }

  const updatedSession = updateSession(from, { frequency: mapped, step: STEPS.COMPLETE });

  const confirmation = buildConfirmation(
    updatedSession.categories,
    updatedSession.channelPreference,
    updatedSession.frequency
  );

  await sendMessage(replyTo, confirmation);

  try {
    await savePreferences(from, updatedSession);
    console.log(`[MEMORY] Preferences saved for ${from}`);
  } catch (err) {
    console.error(`[MEMORY] Error saving preferences for ${from}:`, err.message);
  }
}

async function sendCategoryPrompt(to) {
  await sendTemplate(to, process.env.CONTENT_SID_CATEGORIES);
}

async function sendChannelPrompt(to) {
  await sendTemplate(to, process.env.CONTENT_SID_CHANNEL);
}

async function sendFrequencyPrompt(to) {
  await sendTemplate(to, process.env.CONTENT_SID_FREQUENCY);
}

module.exports = { handleInbound };
