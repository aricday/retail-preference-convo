const { updateSession, findByAwaitingNlp, STEPS } = require("../state");
const { sendMessage, sendTemplate } = require("../send");

async function handleIntelligence(req, res) {
  res.status(200).json({ received: true });

  const payload = req.body;
  console.log("[INTELLIGENCE] Webhook received:", JSON.stringify(payload, null, 2));

  const operatorResults = payload?.operatorResults || [];

  for (const opResult of operatorResults) {
    const operatorId = opResult?.operator?.id;
    const result = opResult?.result;

    if (!result) continue;

    if (operatorId === process.env.CATEGORY_OPERATOR_ID) {
      await handleCategoryResult(result);
    } else if (operatorId === process.env.PII_OPERATOR_ID) {
      await handlePiiResult(result);
    }
  }
}

async function handleCategoryResult(result) {
  const categories = result.categories || [];
  const confidence = result.confidence || "low";
  const rawText = result.raw_text || "";

  const awaitingSessions = findByAwaitingNlp();
  if (!awaitingSessions.length) {
    console.log("[INTELLIGENCE] No session awaiting NLP result");
    return;
  }

  for (const { phone, session } of awaitingSessions) {
    if (session.step !== STEPS.CATEGORIES || !session.awaitingNlp) continue;

    const replyTo = session.replyTo || phone;

    if (categories.includes("other") || confidence === "low") {
      const updated = session.categories.length > 0 ? session.categories : ["other"];
      updateSession(phone, {
        categories: updated.includes("other") ? updated : [...updated, "other"],
        categoriesOtherText: rawText,
        awaitingNlp: false,
        step: STEPS.CHANNEL,
      });
      await sendMessage(replyTo, `We've noted your interest: "${rawText}"`);
      await sendTemplate(replyTo, process.env.CONTENT_SID_CHANNEL);
    } else {
      const newCategories = [...new Set([...session.categories, ...categories])];
      updateSession(phone, {
        categories: newCategories,
        awaitingNlp: false,
        step: STEPS.CHANNEL,
      });
      await sendMessage(replyTo, `Got it! We mapped that to: ${categories.join(", ")}`);
      await sendTemplate(replyTo, process.env.CONTENT_SID_CHANNEL);
    }
  }
}

async function handlePiiResult(result) {
  if (result.contains_pii) {
    console.log(`[PII] Detected PII types: ${result.pii_types.join(", ")}`);
  }
}

module.exports = { handleIntelligence };
