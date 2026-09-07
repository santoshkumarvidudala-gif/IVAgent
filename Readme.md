# CALL-E Appointment Agent 📞🤖

An autonomous AI voice telephony and appointment booking assistant powered by **Gemini 2.5** and the **CALL-E Autonomous Calling Engine**. The agent dials real businesses (clinics, doctors, salons, auto shops, etc.), negotiates appointment schedules, handles conversational objections, respects strict privacy guardrails, and exports booked appointments directly into Google Calendar and `.ics` files.

---

## ✨ Key Features

- **Autonomous Outbound Calling**:
  - Direct PSTN carrier dialing via the `@call-e/cli` / `@call-e/calle` engine to physical phone numbers.
  - Optional Twilio voice gateway and GCP telephony integration.
  - Interactive browser-based fallback simulation with Web Audio ringers, DTMF tones, and audio synthesis.

- **Multilingual Support**:
  - Native conversational openers and dialogue flows for Indian regional languages: **Telugu**, **Hindi**, **Tamil**, **Kannada**, **Malayalam**, **Marathi**, **Bengali**, **Gujarati**, and **Punjabi**, alongside **English**.
  - Localized greetings (e.g., Telugu: *“నమస్కారం అండి, నేను Santosh Kumar తరపున మాట్లాడుతున్నాను...”*).

- **Google Calendar & iCal (.ics) Integration**:
  - **Add to Google Calendar** button directly on the booked appointment report and dispatch receipt.
  - Automatically downloads a standard RFC 5545 `.ics` calendar event containing appointment time, clinic address, assigned practitioner, contact numbers, and arrival instructions.
  - Opens Google Calendar web event creation template pre-filled in a single click.

- **Real-Time Call Experience & Human Intervention**:
  - Live animated audio waveform visualizer synced to synthetic or carrier audio.
  - Dynamic real-time transcript streaming with speaker tags (Agent vs. Receptionist).
  - **Live Intervention Panel**: Allows the user to whisper instructions to the agent or immediately take over the call if human escalation is needed.

- **Data Protection & Guardrails**:
  - Built-in redaction engine automatically strips credit card numbers, CVVs, SSNs, and banking credentials from transcripts and reports.
  - Prevents unauthorized financial commitments over the phone.

- **Structured Reporting & Confirmation Dispatch**:
  - Extracts confirmed appointment slots, alternative recommendations, clinic policies, and estimated fees.
  - Dispatches SMS / Email confirmations with quick-copy summaries.
  - Call analytics dashboard with appointment success rates and conversion metrics.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **React 19** with **TypeScript** and **Vite**
- **Tailwind CSS v4** for styling
- **Motion (`motion/react`)** for smooth layout animations and modal transitions
- **Recharts** for call analytics and success rate visualizations
- **Lucide React** for icons
- **Web Audio API** for interactive acoustic cues, ringtones, and connection chimes

### Backend & AI
- **Node.js & Express** running via `tsx` in development and bundled with `esbuild` for production
- **Google GenAI SDK (`@google/genai`)**: Uses Gemini 2.5 for turn-by-turn voice response planning, real-time agent responses, and final call summarization
- **CALL-E CLI Service (`calleService.ts`)**: Manages MCP-based autonomous agent runs, device authorizations, and status polling

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and provide your API keys:
```env
# Required for Gemini AI logic & summarization
GEMINI_API_KEY=your_gemini_api_key_here

# Telephony Configuration (Optional for real PSTN calls)
CALLE_API_KEY=your_calle_api_key_here
CALLE_BASE_URL=https://api.heycall-e.com
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_number_here
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/calle/auth/status` | Checks CALL-E CLI authentication and device approval status |
| `POST` | `/api/calle/auth/login-url` | Generates a fresh device authorization URL for CALL-E |
| `GET` | `/api/calle/call/status/:runId` | Queries the live status and activity log of a CALL-E run |
| `POST` | `/api/start-enquiry-call` | Initiates an outbound telephone call or live simulation session |
| `POST` | `/api/live-call-turn` | Processes the next conversational turn with Gemini 2.5 |
| `POST` | `/api/finalize-call-report` | Generates structured appointment outcomes, slots, and notes |
| `POST` | `/api/dispatch-confirmation` | Dispatches SMS / Email confirmations to the user |

---

## 📅 Calendar Export (.ics) Usage

When a call completes and an appointment slot is verified:
1. Navigate to the **Call Report** tab or view the **Confirmation Dispatch** card.
2. Click **Add to Google Calendar**.
3. The system will:
   - Generate and download an `.ics` calendar file with all event metadata.
   - Open a pre-populated Google Calendar event link in your browser.
4. You can also click **Download iCal (.ics)** to save the standalone calendar file for Apple Calendar, Outlook, or Thunderbird.

---

## 🔒 Security & Privacy

All outbound phone requests and incoming conversational transcripts are scrubbed in real-time through the server-side PII sanitizer. Sensitive tokens like Gemini and CALL-E API keys are strictly retained on the backend and never exposed to the client.
