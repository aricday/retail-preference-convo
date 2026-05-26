# Omnichannel RCS/SMS Preference Center POC

## Transform One-Way Promotional Messaging Into Two-Way Branded Conversations

---

## The Business Opportunity

Retail ISVs send billions of outbound promotional messages every day on behalf of their brand customers. These messages are one-directional, plain-text, and offer no mechanism for the consumer to express preferences, provide feedback, or engage with the brand beyond a simple opt-out.

**This POC demonstrates how ISVs can help their retail brands convert static marketing communications into rich, two-way conversational experiences using RCS and Twilio's Conversations platform.**

### What This Means for ISVs

| Today (SMS Blast) | With This Solution (Conversational RCS) |
|---|---|
| One-way promotional sends | Two-way preference collection with rich media |
| Plain text, no branding | Branded cards with logos, images, and verified sender |
| Binary opt-in/opt-out only | Granular category, channel, and frequency preferences |
| No customer context | Persistent customer memory across interactions |
| No insight into customer intent | AI-powered natural language understanding |
| Siloed channel data | Unified customer profile across RCS, SMS, and future channels |

### Revenue & Retention Impact

- **Higher engagement rates**: RCS rich cards with tappable action chips vs. plain text numbered replies
- **Reduced opt-out**: Customers who control their preferences churn less
- **Richer targeting data**: Category preferences enable precision marketing, increasing campaign ROI
- **Channel flexibility**: Brands can reach customers on their preferred channel
- **Future-proof architecture**: The same infrastructure supports WhatsApp, Voice, and Email expansion

---

## How It Works

A consumer texts a keyword (JOIN) to the brand's number. The system delivers a branded, interactive preference center via RCS rich cards — with automatic SMS fallback for non-RCS devices. The consumer selects product categories, communication channel, and frequency preferences by tapping action chips. All preferences are stored in a persistent customer profile accessible via API.

### Conversation Flow

```
Consumer                           Brand (via Twilio)
   │                                      │
   │──── "JOIN" ─────────────────────────▶│
   │                                      │
   │◀──── [Rich Card: Opt-In] ────────────│  Branded card with Subscribe button
   │                                      │
   │──── Tap "Y - Subscribe" ───────────▶│
   │                                      │
   │◀──── [Rich Card: Categories] ────────│  Tappable chips: Groceries, Tech, etc.
   │                                      │
   │──── Tap "Tech" ─────────────────────▶│
   │──── Tap "Business" ─────────────────▶│
   │──── Tap "Done" ─────────────────────▶│
   │                                      │
   │◀──── [Rich Card: Channel] ───────────│  Chips: RCS/SMS, Push, Email
   │                                      │
   │──── Tap "Text (RCS/SMS)" ──────────▶│
   │                                      │
   │◀──── [Rich Card: Frequency] ─────────│  Chips: Daily, Weekly, Monthly
   │                                      │
   │──── Tap "Weekly" ───────────────────▶│
   │                                      │
   │◀──── Confirmation Summary ───────────│  Preferences saved to memory
   │                                      │
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONSUMER DEVICE                                     │
│                   (RCS-capable or SMS fallback)                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TWILIO MESSAGING SERVICE                                   │
│              (RCS Agent + Toll-Free SMS Sender Pool)                          │
│              Native RCS → SMS failover, no custom logic                      │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────┐
│  Content         │ │  Application    │ │  TWILIO CONVERSATIONS LAYER     │
│  Templates       │ │  Server         │ │                                 │
│  (HX SIDs)      │ │  (Express.js)   │ │  ┌───────────────────────────┐  │
│                  │ │                 │ │  │ Conversation Orchestrator │  │
│  - Opt-In Card  │ │  - Webhook      │ │  │ (GROUP_BY_PROFILE)        │  │
│  - Categories   │ │    Handler      │ │  │ - Unified thread per user │  │
│  - Channel Pref │ │  - State        │ │  │ - RCS + SMS stitching     │  │
│  - Frequency    │ │    Machine      │ │  │ - 30-min timeout          │  │
│  - Category Ack │ │  - Memory       │ │  └─────────────┬─────────────┘  │
│                  │ │    Client       │ │                │                │
│  Each includes: │ │                 │ │  ┌─────────────▼─────────────┐  │
│  twilio/card    │ │                 │ │  │ Conversation Memory       │  │
│  (RCS) +        │ │                 │ │  │ - Customer profiles       │  │
│  twilio/text    │ │                 │ │  │ - Preference observations │  │
│  (SMS fallback) │ │                 │ │  │ - Recall API retrieval    │  │
│                  │ │                 │ │  └─────────────┬─────────────┘  │
└──────────────────┘ └─────────────────┘ │                │                │
                                         │  ┌─────────────▼─────────────┐  │
                                         │  │ Conversation Intelligence │  │
                                         │  │ - NLP category mapping    │  │
                                         │  │ - PII detection           │  │
                                         │  │ - Real-time per-message   │  │
                                         │  └───────────────────────────┘  │
                                         └─────────────────────────────────┘
```

---

## Twilio Components

### Messaging Service (Sender Pool + Failover)

A Messaging Service groups the RCS agent and a toll-free SMS number into a single sender pool. When sending via `messagingServiceSid`, Twilio automatically selects RCS for capable devices and falls back to SMS — no custom failover logic required.

### Content Templates (Rich Media)

Each step in the conversation is defined as a Content Template containing both:
- `twilio/card` — RCS rich card with branded image, title, body, and tappable action chips
- `twilio/text` — SMS plain-text fallback with numbered options

This ensures a consistent experience regardless of device capability.

### Conversation Orchestrator

Automatically captures all RCS and SMS traffic into unified conversation threads per customer using `GROUP_BY_PROFILE` grouping. If a customer starts on RCS and later interacts via SMS, both interactions belong to the same conversation with the same profile.

### Conversation Memory (Recall API)

Stores customer preferences as observations linked to a persistent profile. The Recall API enables semantic retrieval — future interactions (support calls, campaign targeting, loyalty programs) can pull this context in real time.

**What's stored:**
- Product category preferences (selected or NLP-inferred)
- Communication channel preference
- Frequency preference
- Opt-in timestamp and channel (TCPA/CTIA compliance)

### Conversation Intelligence

Custom AI operators analyze every inbound message in real time:

- **Category Mapper** — Classifies freeform natural language (e.g., "diapers and dog food") into product categories without breaking the automated flow
- **PII Detector** — Flags accidental credit card numbers, SSNs, or addresses to prevent sensitive data from persisting to memory

---

## Installation Guide

### Prerequisites

- Node.js 18+
- A Twilio paid account (RCS requires a paid account)
- A toll-free SMS number in your Twilio inventory
- An RCS Business Messaging draft agent (created in Twilio Console)
- [ngrok](https://ngrok.com/) for exposing your local server to webhooks

### Step 1: Clone and Install

```bash
git clone <this-repo>
cd arics-retail-preference-center
npm install
```

### Step 2: Create Your RCS Draft Agent

1. Go to **Twilio Console > Messaging > RCS > Senders**
2. Create a new RCS sender with your brand name, logo (224x224px), and description
3. Add your test phone numbers to the whitelist
4. Note the RCS agent address (format: `rcs:your_brand_name_xxxxx_agent`)

### Step 3: Create a Messaging Service

1. Go to **Twilio Console > Messaging > Services**
2. Create a new Messaging Service
3. Add your **toll-free number** to the sender pool (Phone Numbers tab)
4. Add your **RCS agent** to the sender pool (Channel Senders tab)
5. Disable **Sticky Sender** (Settings tab) — this ensures RCS is evaluated on each send
6. Note the Messaging Service SID (`MG...`)

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Fill in:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOLL_FREE_NUMBER=+1XXXXXXXXXX
TWILIO_TOLL_FREE_SID=PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RCS_AGENT_ADDRESS=rcs:your_agent_address_here
PORT=3000
BASE_URL=https://your-subdomain.ngrok-free.app
```

### Step 5: Run Infrastructure Setup

This creates the Memory Store, Intelligence operators, and Orchestrator configuration:

```bash
npm run setup
```

Copy the output SIDs into your `.env` file:
```
MEMORY_STORE_SID=mem_store_xxxxx
ORCHESTRATOR_CONFIG_ID=conv_configuration_xxxxx
INTELLIGENCE_CONFIG_ID=intelligence_configuration_xxxxx
CATEGORY_OPERATOR_ID=intelligence_operator_xxxxx
PII_OPERATOR_ID=intelligence_operator_xxxxx
```

### Step 6: Create Content Templates

```bash
node scripts/create-templates.js
```

Copy the output SIDs into your `.env`:
```
CONTENT_SID_OPT_IN=HXxxxxx
CONTENT_SID_CATEGORIES=HXxxxxx
CONTENT_SID_CATEGORIES_ACK=HXxxxxx
CONTENT_SID_CHANNEL=HXxxxxx
CONTENT_SID_FREQUENCY=HXxxxxx
```

### Step 7: Configure Webhooks

Update your Messaging Service inbound webhook URL:
- **Inbound URL**: `https://your-subdomain.ngrok-free.app/webhook/inbound`
- **Status Callback**: `https://your-subdomain.ngrok-free.app/webhook/status`

### Step 8: Start the Server

```bash
# Start ngrok in a separate terminal
ngrok http 3000 --subdomain=your-subdomain

# Start the application
npm start
```

### Step 9: Test

Text **JOIN** to your toll-free number from a whitelisted RCS device. You should receive a branded rich card with a Subscribe button.

---

## Project Structure

```
├── .env.example              # Environment variable template
├── package.json              # Dependencies and scripts
├── assets/                   # Static media (brand images)
├── scripts/
│   ├── setup-infrastructure.js   # Creates Twilio resources (Memory, Intelligence, Orchestrator)
│   └── create-templates.js       # Creates RCS/SMS Content Templates
└── src/
    ├── server.js             # Express server + webhook routes
    ├── state.js              # In-memory session state machine
    ├── messages.js           # Message templates + input mapping
    ├── send.js               # Twilio message/template sending
    ├── memory-client.js      # Conversation Memory (Recall API) client
    └── handlers/
        ├── inbound.js        # Main flow logic (keyword → categories → channel → frequency)
        ├── intelligence.js   # NLP category mapping + PII detection webhook handler
        └── status.js         # Delivery status logging
```

---

## Sample API Requests

The following examples demonstrate how to retrieve customer data from the Twilio Conversations platform after the preference flow completes.

### Recall Customer Preferences (Memory API)

Retrieve stored preferences for a customer profile:

```bash
curl -X POST \
  "https://memory.twilio.com/v1/Stores/{MEMORY_STORE_SID}/Profiles/{PROFILE_ID}/Recall" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "observationsLimit": 10,
    "summariesLimit": 3
  }'
```

**Response:**
```json
{
  "observations": [
    {
      "id": "mem_observation_01ks8npqr2eh783rwzmsnt7324",
      "content": "Customer selected marketing preferences: Categories: tech, business. Channel preference: RCS/SMS. Frequency: Weekly. Opted in via RCS on 2026-05-22T20:47:00Z",
      "source": "preference_center",
      "occurredAt": "2026-05-22T20:47:00Z",
      "createdAt": "2026-05-22T20:47:02Z"
    }
  ],
  "summaries": [],
  "communications": [],
  "meta": { "queryTime": 45 }
}
```

### Look Up a Customer Profile by Phone Number

```bash
curl -X POST \
  "https://memory.twilio.com/v1/Stores/{MEMORY_STORE_SID}/Profiles/Lookup" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"idType": "phone", "value": "+15558675310"}'
```

**Response:**
```json
{
  "profiles": [
    {
      "id": "mem_profile_01ks8nh1m8e6gan4ftrhatr07j",
      "traits": {
        "Contact": { "phone": "+15558675310" }
      },
      "createdAt": "2026-05-22T20:20:16Z"
    }
  ]
}
```

### Query Intelligence Operator Results

Retrieve NLP classification results for a conversation:

```bash
curl -X GET \
  "https://intelligence.twilio.com/v3/OperatorResults?intelligenceConfigurationId={INTELLIGENCE_CONFIG_ID}&conversationId={CONVERSATION_ID}" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Category Mapper):**
```json
{
  "items": [
    {
      "id": "intelligence_operatorresult_01ks8q2q3vf1h8texg61mv0hae",
      "operator": {
        "id": "intelligence_operator_01ks8n9f9mf5ktpfhbkgyv9gzf",
        "displayName": "Retail Category Mapper"
      },
      "outputFormat": "JSON",
      "result": {
        "categories": ["groceries"],
        "confidence": "high",
        "raw_text": "diapers and dog food"
      },
      "executionDetails": {
        "trigger": { "on": "COMMUNICATION" },
        "channels": ["RCS"],
        "participants": [
          { "profileId": "mem_profile_xxxxx", "type": "CUSTOMER" },
          { "profileId": null, "type": "AGENT" }
        ]
      },
      "metadata": {
        "system": {
          "latencyMs": 1058,
          "resolvedModel": "gpt-4o-mini"
        }
      }
    }
  ]
}
```

**Response (PII Detector):**
```json
{
  "items": [
    {
      "id": "intelligence_operatorresult_01ks8q2q6veafbvhrr5xxteftg",
      "operator": {
        "id": "intelligence_operator_01ks8n9frhe7s87djj2h8bpx9t",
        "displayName": "PII Detector"
      },
      "outputFormat": "JSON",
      "result": {
        "contains_pii": false,
        "pii_types": ["none"]
      }
    }
  ]
}
```

### List Conversations (Orchestrator)

View active conversations captured by the Orchestrator:

```bash
curl -X GET \
  "https://conversations.twilio.com/v2/Conversations?Status=ACTIVE&PageSize=10" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### Read Communications Within a Conversation

View all messages exchanged in a conversation (both customer and agent):

```bash
curl -X GET \
  "https://conversations.twilio.com/v2/Conversations/{CONVERSATION_ID}/Communications" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Key Takeaways for ISVs

1. **Same API, richer experience** — RCS uses the same `messages.create()` API as SMS. The Messaging Service handles channel selection automatically.

2. **No-code fallback** — SMS fallback is native to the Messaging Service. Non-RCS devices receive the `twilio/text` version of the same Content Template.

3. **Persistent customer context** — Conversation Memory creates a customer profile that persists across sessions and channels. Future interactions start with context, not from scratch.

4. **AI without complexity** — Conversation Intelligence operators run automatically on every message. No separate ML pipeline to build or maintain.

5. **Compliance built-in** — Opt-in timestamps, message bodies, and channels are captured automatically for TCPA/CTIA audit trails.

---

Built with [Twilio Conversations](https://www.twilio.com/docs/conversations), [RCS Business Messaging](https://www.twilio.com/docs/rcs), and [Conversation Intelligence](https://www.twilio.com/docs/conversation-intelligence).
