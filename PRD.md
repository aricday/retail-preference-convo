# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project Name: Aric's Retail ISV Super Store Omnichannel SMS/RCS Preference Center

**Date:** May 2026

**Author:** Aric Day

**Status:** Draft

---

### 1. Executive Summary & Objective

Aric's Retail ISV Super Store aims to launch an automated, compliance-first marketing opt-in and preference center. The primary engagement channel will be **Rich Communication Services (RCS)** to deliver a modern, interactive, and branded experience, with **SMS** serving as a seamless fallback channel for non-compatible devices.

This project will natively utilize the **Twilio Conversations Layer**—specifically leveraging **Conversation Orchestrator**, **Conversation Memory**, and **Conversation Intelligence**—to manage multi-turn interactions, extract customer preferences into persistent profiles, and gain deep interaction insights.

**Demo Scope:** This is a live POC demoed on real phones. The RCS agent is a draft agent with whitelisted test destinations. The trigger is keyword-only (no web form). Downstream data is stored exclusively in Twilio's Conversation Memory (Recall API) — no external CRM/CDP sync required.

**Business Context:** "Aric's Retail ISV Super Store" is a fictional retail brand used for this POC demonstration.

---

### 2. Sender & Channel Configuration

| Component | Configuration |
| --- | --- |
| **RCS Agent** | Draft agent for Aric's Retail ISV Super Store (whitelisted test numbers only) |
| **SMS Sender** | Toll-free number (existing inventory) |
| **Failover Strategy** | Twilio Messaging Service with RCS + SMS sender pool; native platform failover (no custom timer logic) |
| **STOP/HELP** | Handled at Twilio platform level (auto-responder) |

---

### 3. User Experience & Messaging Flow

#### 3.1 Entry Points

| Keyword | Behavior |
| --- | --- |
| **JOIN** | New user: starts opt-in flow. Returning user: skips to preference update (Step 4). |
| **MANAGE** | Same as returning-user JOIN — skips to preference update (Step 4). |
| **STOP** | Platform-level unsubscribe. |
| **HELP** | Platform-level help response. |

#### 3.2 Complete Conversation Flow

**Step 1 — Opt-In Compliance Message**

> "Aric's Retail ISV Super Store: Reply Y to confirm your subscription to recurring automated promotional msgs. Msg & data rates may apply. Reply STOP to cancel."

*Note: Returning users (JOIN again or MANAGE) skip Steps 1-3 and go directly to Step 4.*

**Step 2 — User Confirms ("Y")**

System proceeds to preference collection.

**Step 3 — Timeout / Drop-Off**

If user replies "Y" but does not complete preference steps, no follow-up nudge is sent. User remains opted-in with no preferences recorded.

---

**Step 4 — Category Preferences**

| Channel | Experience |
| --- | --- |
| **RCS** | Rich card with brand logo, verified sender badge, and interactive action chips/checkboxes for the 5 categories. |
| **SMS** | Structured text: *"Choose your favorite categories (e.g., 1, 3) or ALL: 1. Groceries 2. Tech 3. Home/Seasonal 4. Apparel/Beauty 5. Business"* |

**Input Handling:**
- Single integers (`1`), comma-separated (`1,3,4`), keywords (`ALL`, `Everything`)
- Freeform natural language (e.g., "diapers and dog food") → NLP-mapped via Conversation Intelligence
- If NLP cannot confidently map to a category → stored as `"other"` with exact user text captured in memory

---

**Step 5 — Channel Preference**

| Channel | Experience |
| --- | --- |
| **RCS** | Rich action chips: `RCS/SMS` · `Push` · `Email` |
| **SMS** | *"How would you like to hear from us? Reply: 1. Text (RCS/SMS) 2. Push Notifications 3. Email"* |

---

**Step 6 — Communication Frequency**

| Channel | Experience |
| --- | --- |
| **RCS** | Rich action chips: `Daily` · `Weekly` · `Monthly` |
| **SMS** | *"How often would you like to hear from us? Reply: 1. Daily 2. Weekly 3. Monthly"* |

---

**Step 7 — Confirmation Summary**

> "You're all set! 🎉 Here's what we saved:
> 📋 Categories: [selected categories]
> 📱 Channel: [selected channel]
> 🔔 Frequency: [selected frequency]
>
> Reply MANAGE anytime to update your preferences. Reply STOP to unsubscribe."

---

### 4. Twilio Architecture & Technical Requirements

```
[ User Device ]
       │
       ▼ (Keyword: JOIN / MANAGE)
┌────────────────────────────────────────────────────────┐
│            TWILIO MESSAGING SERVICE                     │
│   (Sender Pool: RCS Agent + Toll-Free SMS)             │
│   (Native RCS → SMS Failover)                          │
└───────────────────────┬────────────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────────┐
│               TWILIO CONVERSATIONS LAYER               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Conversation Orchestrator                     │  │
│  │    - Routes & stitches RCS/SMS to unified thread │  │
│  │    - GROUP_BY_PROFILE configuration              │  │
│  │    - 30-min inactivity timeout                   │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. Conversation Memory                           │  │
│  │    - Extracts preferences via Observation Engine │  │
│  │    - Stores to profile (Recall API)              │  │
│  │    - Identity resolution across channels         │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. Conversation Intelligence                     │  │
│  │    - NLP: freeform text → category mapping       │  │
│  │    - PII redaction (credit cards, addresses)     │  │
│  │    - Sentiment & intent extraction               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### 4.1. Conversation Orchestrator

* **Configuration:** `conversationGroupingType` set to `GROUP_BY_PROFILE`
* **Channel Stitching:** Regardless of whether user interacts via RCS or SMS, the conversation ID remains identical — preserving the system of record.
* **Timeout:** Active conversation lifecycle closes after **30 minutes** of user inactivity.

#### 4.2. Conversation Memory

* **Memory Store:** Dedicated memory store for profile data.
* **Profile Schema:**

| Field | Type | Values |
| --- | --- | --- |
| `categories` | array | `groceries`, `tech`, `home_seasonal`, `apparel_beauty`, `business`, `other` |
| `categories_other_text` | string | Raw user text when NLP maps to "other" |
| `channel_preference` | string | `rcs_sms`, `push`, `email` |
| `frequency` | string | `daily`, `weekly`, `monthly` |
| `opt_in_timestamp` | datetime | ISO 8601 timestamp of "Y" confirmation |
| `opt_in_channel` | string | `rcs` or `sms` |
| `opt_in_message_body` | string | Exact message body of opt-in for compliance |

* **Observation Extraction:** On conversation close or completion of Step 7, the memory engine extracts and persists preferences.
* **Identity Resolution:** Phone number serves as primary identifier, linking interactions across channels to a unified profile.
* **Retrieval:** All profile data accessible via the Recall API.

#### 4.3. Conversation Intelligence

* **NLP Processing:** Freeform text responses in Step 4 are analyzed and mapped to the closest category. Unmappable responses default to `"other"` with text preserved.
* **PII Redaction:** Strict masking of any accidental PII (credit card numbers, addresses) entered during the conversation.
* **Intent Signals:** Extract sentiment and intent to enrich interaction analytics.

---

### 5. Functional Requirements

| ID | Requirement |
| --- | --- |
| **FR-01** | **Compliance Tracking:** Log precise timestamp, message body, and channel of "Y" opt-in (TCPA/CTIA). |
| **FR-02** | **Failover Delivery:** Twilio Messaging Service handles RCS→SMS failover natively via sender pool configuration. |
| **FR-03** | **Multi-Selection Processing:** Accept single integers, comma-separated strings, semantic keywords (ALL/Everything), and freeform NLP-mapped text. |
| **FR-04** | **Re-entry:** JOIN (returning user) and MANAGE keywords restart preference collection at Step 4. |
| **FR-05** | **Multi-Turn Sequencing:** Walk user through categories → channel → frequency as discrete steps. |
| **FR-06** | **RCS Rich Interactions:** All selection steps render as rich action chips on RCS-capable devices. |
| **FR-07** | **SMS Templates:** All selection steps have structured numbered-reply text templates for SMS fallback. |
| **FR-08** | **NLP Fallback:** Unclassifiable freeform input stored as "other" with exact text in memory. |

---

### 6. Non-Functional Requirements & Success Metrics

* **Data Integrity:** Preference updates persist to Conversation Memory (Recall API) within **5 minutes** of conversation closing.
* **Target KPIs:**
  * RCS Engagement Rate vs. SMS Fallback Rate
  * Preference Completion Rate (users who complete all 3 steps vs. drop-off after opt-in)
  * NLP Classification Accuracy (percentage of freeform inputs correctly mapped)

---

### 7. Out of Scope

* Web form trigger (keyword-only for this POC)
* Downstream CDP/CRM sync (Snowflake, Segment, etc.)
* Follow-up nudge for incomplete preferences
* Production RCS agent verification (draft agent with whitelisted numbers only)
* Custom STOP/HELP handling (platform-level)

---
