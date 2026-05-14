# missed-callback-ai

An AI voice agent that automatically calls back customers whose calls were missed, holds a short conversation, and stores the result in a database for the business owner to review.

Final school project — a focused demo, not a SaaS product.

---

## Live deployment

| Environment | Branch | Backend URL | Status |
|---|---|---|---|
| **production** | `main` | https://backend-production-b7e9.up.railway.app | ✅ live |
| **staging** | `dev` | https://backend-staging-eb69.up.railway.app | ✅ live |

Both backends respond to `GET /health` with `{"status":"ok"}`. Production env vars are filled in (real Twilio number, Vapi assistant, Supabase project); staging still has placeholders.

---

## What it does

1. A customer dials the **business's Twilio number**.
2. Twilio forwards the call to the **owner's private phone** for ~15 seconds.
3. If the owner doesn't pick up (`no-answer` / `busy` / `failed`), the system detects the miss.
4. The backend asks **Vapi** to place an outbound call **from the same Twilio number** back to the customer.
5. A **Vapi voice agent** (STT → LLM → TTS) talks to the customer: answers basic business questions and offers to book an appointment.
6. When the call ends, **Vapi posts an end-of-call report** to the backend.
7. The backend **always inserts a row into `calls`** (every recovered conversation), and **additionally inserts a row into `leads`** only when the conversation produced an opportunity (caller asked for an appointment or gave a name).
8. (Future) A dashboard reads `calls` so the owner sees every recovered call, with `leads` highlighted as the subset worth following up.

---

## Architecture

```mermaid
flowchart LR
    A[Customer] -->|1. dial| B[Twilio number]
    B -->|2. Dial timeout=15| C[Owner's phone]
    C -. no-answer .-> D[FastAPI backend]
    B -->|3. dial-status webhook| D
    D -->|4. POST /call| E[Vapi]
    E -->|5. callback from Twilio number| A
    E -->|6. end-of-call webhook| D
    D -->|7a. insert every conversation| F[(Supabase calls)]
    D -->|7b. insert if opportunity| G[(Supabase leads)]
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 · FastAPI · httpx |
| Telephony | Twilio Programmable Voice |
| Voice AI | Vapi (STT + LLM + TTS) |
| Database | Supabase (Postgres) |
| Hosting | Railway (Docker, europe-west4) |
| Frontend (planned) | Next.js 14 + Tailwind |

---

## Repository layout

```
.
├── backend/                          # deployed to Railway
│   ├── app/
│   │   ├── main.py                   # FastAPI app + /health
│   │   ├── config.py                 # Pydantic settings (env)
│   │   ├── security.py               # Twilio signature verification
│   │   ├── twilio_routes.py          # /twilio/voice  +  /twilio/dial-status
│   │   ├── vapi_client.py            # outbound: trigger Vapi callback
│   │   ├── vapi_routes.py            # /vapi/end-of-call
│   │   └── supabase_client.py        # insert_lead() via PostgREST
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── railway.json
│   └── .env.example
├── frontend/                         # placeholder Next.js scaffold
│   ├── app/
│   ├── package.json
│   └── ...
└── supabase/                         # managed via Supabase CLI
    ├── config.toml
    └── migrations/
        ├── 20260504123229_create_leads.sql
        ├── 20260505000000_add_missed_call_count.sql
        └── 20260514000000_create_calls.sql
```

---

## Branch & environment strategy

```
main  → Railway production env  → backend-production-b7e9.up.railway.app
dev   → Railway staging env     → backend-staging-eb69.up.railway.app
```

A push to `main` auto-deploys backend to production. A push to `dev` auto-deploys backend to staging. The `frontend` Railway service exists in both environments as a placeholder; it has no deploy yet.

---

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness probe (Railway) |
| POST | `/twilio/voice` | Inbound voice webhook → returns TwiML `<Dial>` to forward to owner |
| POST | `/twilio/dial-status` | `<Dial>` action callback → triggers Vapi callback if call was missed |
| POST | `/vapi/end-of-call` | Vapi end-of-call report → inserts row into `calls` (always) and into `leads` (if appointment requested or caller named) |

---

## Database schema

Two tables, no auth, no RLS — demo only.

- **`calls`** = **every** recovered callback conversation. One row per Vapi end-of-call report. The dashboard reads from here.
- **`leads`** = the subset of conversations that look like a potential customer / appointment opportunity. Written **only** when the caller asked for an appointment **or** gave their name. Also used by `/twilio/dial-status` to log `status='missed'` rows for repeat-caller tracking.

```sql
create table calls (
  id                    uuid primary key default gen_random_uuid(),
  phone                 text not null,
  call_summary          text,
  transcript            text,
  recording_url         text,
  duration_seconds      int,
  ended_reason          text,
  appointment_requested boolean not null default false,
  preferred_time        text,
  status                text not null default 'completed',
  created_at            timestamptz not null default now()
);

create table leads (
  id                    uuid primary key default gen_random_uuid(),
  phone                 text not null,
  name                  text,
  call_summary          text,
  appointment_requested boolean not null default false,
  preferred_time        text,
  status                text not null default 'new',
  missed_call_count     integer not null default 0,
  created_at            timestamptz not null default now()
);
```

There is no FK between the two — `calls` is a flat log, `leads` is a flat opportunity table. The dashboard can join on `phone` if it ever needs to link a lead back to its conversation. Kept deliberately simple for the MVP.

Project on Supabase: `missed-callback-ai` (ref `gitmyhrstoxjxqawsfbr`).

---

## Setup

### 1. Supabase

```bash
# already done — keeping for reference
supabase login
supabase link --project-ref gitmyhrstoxjxqawsfbr
supabase db push
```

To change the schema later: `supabase migration new <name>` → edit → `supabase db push`.

### 2. Vapi

In the Vapi dashboard:

1. Create an **assistant** with a system prompt for the demo (greeting, basic Q&A, offer to book).
2. Under **Phone Numbers → Import**, register the Twilio number (paste Twilio Account SID + Auth Token). Vapi returns a `phoneNumberId`.
3. On the **assistant** (not the phone number — one place is enough), set:
   - **Server URL** → `<PUBLIC_BASE_URL>/vapi/end-of-call`
   - **Server Messages** → make sure `end-of-call-report` is checked. Without this, no webhook is ever sent.
   - **Server URL Secret** (optional) → if set, also export `VAPI_SERVER_SECRET` with the same value; otherwise leave both empty and the backend skips the header check.
4. Under **Analysis**, enable both `summaryPlan` and `structuredDataPlan`. The new dashboard UI ("Structured Outputs & Scorecard") sometimes saves the fields without actually flipping the plans on — verify via the API (see below). One-shot PATCH that does both:

   ```bash
   curl -X PATCH "https://api.vapi.ai/assistant/$VAPI_ASSISTANT_ID" \
     -H "Authorization: Bearer $VAPI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "analysisPlan": {
         "summaryPlan": { "enabled": true },
         "structuredDataPlan": {
           "enabled": true,
           "schema": {
             "type": "object",
             "properties": {
               "name":                  { "type": "string",  "description": "Caller first name if mentioned." },
               "appointment_requested": { "type": "boolean", "description": "True if the caller asked to book." },
               "preferred_time":        { "type": "string",  "description": "Caller preferred time, free text." },
               "call_summary":          { "type": "string",  "description": "One-sentence summary of the call." }
             }
           }
         }
       }
     }'
   ```

   Verify it stuck:

   ```bash
   curl -s -H "Authorization: Bearer $VAPI_API_KEY" \
     "https://api.vapi.ai/assistant/$VAPI_ASSISTANT_ID" \
     | jq '{server, analysisPlan}'
   ```

   Both `summaryPlan.enabled` and `structuredDataPlan.enabled` must be `true`. If they aren't, the backend will keep receiving `end-of-call-report` events with empty `analysis` and only `phone` will be saved.

### 3. Twilio

In the Twilio console:

1. Buy or use an existing phone number.
2. Under **Voice & Fax → A CALL COMES IN**, set the webhook to:
   - `https://backend-production-b7e9.up.railway.app/twilio/voice` (POST) — for production
   - or the staging URL while testing

### 4. Local backend (optional, for development)

```bash
cd backend
cp .env.example .env
# fill in all values — see the table below
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi 'uvicorn[standard]' twilio httpx pydantic 'pydantic-settings' python-multipart
uvicorn app.main:app --reload --port 8000
```

For local end-to-end testing, expose port 8000 with ngrok and use the ngrok URL as `PUBLIC_BASE_URL` and as the Twilio webhook host.

---

## Environment variables

| Name | Source |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Your Twilio number, E.164 (`+1...`) |
| `OWNER_PRIVATE_PHONE` | Your real phone, E.164 (`+972...`) |
| `VAPI_API_KEY` | Vapi dashboard → Org Settings → Private Key |
| `VAPI_ASSISTANT_ID` | Vapi dashboard → Assistant ID |
| `VAPI_PHONE_NUMBER_ID` | Vapi dashboard → Phone Numbers ID |
| `VAPI_SERVER_SECRET` | Random string, must match the assistant's Server URL Secret |
| `SUPABASE_URL` | `https://gitmyhrstoxjxqawsfbr.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (backend only) |
| `PUBLIC_BASE_URL` | Public URL of this service (Railway URL or ngrok URL) |

`.env` is gitignored — never commit it.

To set a variable on Railway via CLI:

```bash
railway variables --service backend --environment staging --set "TWILIO_ACCOUNT_SID=AC..."
```

---

## Railway infrastructure

The Railway project is `missed-callback-ai`, organised as:

```
Project: missed-callback-ai
├── Environment: production
│   ├── backend   (root=backend, branch=main, Dockerfile build)
│   └── frontend  (placeholder, no source)
└── Environment: staging
    ├── backend   (root=backend, branch=dev,  Dockerfile build)
    └── frontend  (placeholder, no source)
```

Both backend services share a single project-level `backend` service, deployed from different branches per environment. Same for `frontend`.

Health check `/health`, restart policy `ON_FAILURE` (max 5).

### `railway.json` start-command gotcha

Railway runs `startCommand` directly without a shell, so unquoted `$VAR` is not expanded. Wrap in `sh -c` if you rely on env-var interpolation in the command itself:

```json
"startCommand": "sh -c 'uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'"
```

---

## Demo flow (verify locally)

1. `uvicorn app.main:app --reload --port 8000`
2. `ngrok http 8000`, paste the HTTPS URL as `PUBLIC_BASE_URL` and into the Twilio number's voice webhook.
3. Call the Twilio number from a third phone, **don't pick up** your private phone for 15s.
4. The third phone gets called back from the Twilio number — the Vapi agent answers.
5. Have a short conversation, hang up.
6. Open the Supabase **Table Editor**:
   - **`calls`** — a new row appears for **every** conversation, with summary, transcript, recording_url, duration_seconds, ended_reason.
   - **`leads`** — a row appears **only** if you asked for an appointment or gave your name during the call.

### Quick webhook test (without burning Vapi minutes)

```bash
curl -X POST https://backend-staging-eb69.up.railway.app/vapi/end-of-call \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: $VAPI_SERVER_SECRET" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "customer": { "number": "+972501234567" },
      "analysis": {
        "summary": "Customer asked about haircut prices and wants to book.",
        "structuredData": {
          "name": "Dana",
          "appointment_requested": true,
          "preferred_time": "tomorrow at 15:00"
        }
      }
    }
  }'
```

A new row should appear in `calls`, and — because the payload above has `appointment_requested: true` and a `name` — a matching row also in `leads`. Drop those fields from the payload to verify the "calls-only" path: only `calls` should grow.

---

## Troubleshooting: end-of-call rows only have `phone`

After a call, a row should always appear in `calls`. A row in `leads` only appears if the caller asked for an appointment or gave a name — if you expected a `leads` row and don't see one, that's the most likely reason. If a `calls` row is inserted but `call_summary`, `transcript`, `recording_url`, `appointment_requested`, `preferred_time` etc. are all NULL, work through these checks in order:

1. **Is `/vapi/end-of-call` being hit at all?** `railway logs -e production` and look for `app.vapi_routes` lines. If you only see `app.twilio_routes` and `app.vapi_client` (outbound), Vapi is not posting back → the assistant has no Server URL or no `serverMessages` subscribed.
2. **Is the event type `end-of-call-report`?** Other types (`speech-update`, `conversation-update`, `status-update`) are received during the call and are ignored by the handler. Only `end-of-call-report` writes a row.
3. **Does Vapi's call object have an analysis?**
   ```bash
   curl -s -H "Authorization: Bearer $VAPI_API_KEY" "https://api.vapi.ai/call/<call_id>" \
     | jq '{status, endedReason, hasAnalysis: (.analysis != null), summary: .analysis.summary, structuredData: .analysis.structuredData}'
   ```
   If `hasAnalysis: false`, the assistant's `analysisPlan` is disabled — re-run the PATCH in section 2.4 above.
4. **Backend defensive parsing.** `vapi_routes.py` accepts several common naming variants for structured-data keys (`name` / `customerName`, `appointment_requested` / `appointmentRequested`, `preferred_time` / `preferredTime`), and synthesizes a short fallback `call_summary` if Vapi didn't return one — so the column is never NULL after the webhook fires successfully.

---

## Status

- [x] Backend skeleton (FastAPI, Twilio + Vapi + Supabase wiring)
- [x] Twilio missed-call detection
- [x] Vapi outbound callback trigger
- [x] Vapi end-of-call → Supabase insert (with defensive parsing + fallback summary)
- [x] Split storage: `calls` (every conversation) + `leads` (opportunities only)
- [x] Supabase migration applied to remote project
- [x] Railway project + environments (production, staging)
- [x] Backend deployed to both environments with public URLs
- [x] `main` → production, `dev` → staging auto-deploy wired up
- [x] Real env vars filled in (production)
- [x] Twilio webhook + Vapi server URL pointed at production backend
- [x] End-to-end live call test (Server URL, Server Messages, analysisPlan all verified via API)
- [ ] Dashboard (Next.js) reading `calls` (with `leads` highlighted)
- [ ] Frontend deployed
