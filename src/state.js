const sessions = new Map();

const STEPS = {
  OPT_IN: "OPT_IN",
  CATEGORIES: "CATEGORIES",
  CHANNEL: "CHANNEL",
  FREQUENCY: "FREQUENCY",
  COMPLETE: "COMPLETE",
};

function getSession(phone) {
  return sessions.get(phone) || null;
}

function createSession(phone, isReturning = false) {
  const session = {
    phone,
    step: isReturning ? STEPS.CATEGORIES : STEPS.OPT_IN,
    categories: [],
    categoriesOtherText: null,
    channelPreference: null,
    frequency: null,
    optInTimestamp: null,
    optInChannel: null,
    optInMessageBody: null,
    awaitingNlp: false,
  };
  sessions.set(phone, session);
  return session;
}

function updateSession(phone, updates) {
  const session = sessions.get(phone);
  if (!session) return null;
  Object.assign(session, updates);
  sessions.set(phone, session);
  return session;
}

function deleteSession(phone) {
  sessions.delete(phone);
}

function findByAwaitingNlp() {
  const results = [];
  for (const [phone, session] of sessions) {
    if (session.awaitingNlp) {
      results.push({ phone, session });
    }
  }
  return results;
}

module.exports = { STEPS, getSession, createSession, updateSession, deleteSession, findByAwaitingNlp };
