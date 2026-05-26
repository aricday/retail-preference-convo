const MEMORY_BASE = "https://memory.twilio.com/v1";

function getAuthHeaders() {
  const credentials = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

async function lookupProfile(phone) {
  const res = await fetch(
    `${MEMORY_BASE}/Stores/${process.env.MEMORY_STORE_SID}/Profiles/Lookup`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ idType: "phone", value: phone }),
    }
  );
  if (!res.ok) {
    console.log(`[MEMORY] Lookup failed (${res.status}), profile may not exist yet`);
    return null;
  }
  const data = await res.json();
  if (data.profiles && data.profiles.length > 0) {
    return data.profiles[0];
  }
  return null;
}

async function findProfileByPhone(phone) {
  const res = await fetch(
    `${MEMORY_BASE}/Stores/${process.env.MEMORY_STORE_SID}/Profiles?phone=${encodeURIComponent(phone)}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const profiles = data.profiles || data.items || [];
  return profiles.length > 0 ? profiles[0] : null;
}

async function savePreferences(phone, preferences) {
  let profile = await lookupProfile(phone);
  if (!profile) {
    profile = await findProfileByPhone(phone);
  }

  if (!profile) {
    console.log(`[MEMORY] No profile found for ${phone}, cannot save preferences`);
    return null;
  }

  const profileId = profile.id;
  const categories = preferences.categories.join(", ");
  const channelMap = { rcs_sms: "RCS/SMS", push: "Push Notifications", email: "Email" };
  const freqMap = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

  const content = [
    `Customer selected marketing preferences:`,
    `Categories: ${categories}`,
    preferences.categoriesOtherText ? `Other interests (verbatim): "${preferences.categoriesOtherText}"` : null,
    `Channel preference: ${channelMap[preferences.channelPreference] || preferences.channelPreference}`,
    `Frequency: ${freqMap[preferences.frequency] || preferences.frequency}`,
    `Opted in via ${preferences.optInChannel?.toUpperCase() || "unknown"} on ${preferences.optInTimestamp}`,
  ].filter(Boolean).join(". ");

  const res = await fetch(
    `${MEMORY_BASE}/Stores/${process.env.MEMORY_STORE_SID}/Profiles/${profileId}/Observations`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        observations: [
          {
            content,
            source: "preference_center",
            occurredAt: new Date().toISOString(),
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.error(`[MEMORY] Error saving observation:`, err);
    return null;
  }

  const result = await res.json();
  console.log(`[MEMORY] Observation saved for profile ${profileId}`);
  return result;
}

async function recallProfile(profileId) {
  const res = await fetch(
    `${MEMORY_BASE}/Stores/${process.env.MEMORY_STORE_SID}/Profiles/${profileId}/Recall`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        observationsLimit: 10,
        summariesLimit: 3,
      }),
    }
  );
  if (!res.ok) return null;
  return res.json();
}

module.exports = { lookupProfile, findProfileByPhone, savePreferences, recallProfile };
