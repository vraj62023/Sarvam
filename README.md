# Kanoon Chhota — कानून छोटा

> **"Legal documents, in your language, in your voice."**

## The Problem

India has 1.4 billion people and millions of legal documents — court orders, eviction notices, FIR copies, land records, recovery notices — that ordinary citizens receive without understanding. Low literacy, language barriers, and legal jargon create an access-to-justice gap affecting the most vulnerable.

## The Solution

Kanoon Chhota uses Sarvam AI's Indian-language stack to:
1. **Read** the document (photo/PDF upload via Document Intelligence API)
2. **Explain** it in plain language at a Class 6 reading level (Sarvam 105B LLM)
3. **Translate** the explanation into the user's preferred Indian language (Mayura translation model)
4. **Read it aloud** using natural Indian-language TTS (Bulbul v4 Flash)

**B2G angle:** District Legal Services Authorities (DLSA), NALSA, courts, and gram panchayats can embed this as a kiosk or WhatsApp bot.

---

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo>
cd sarvam

# 2. Copy and fill in your API key
cp .env.example .env
# Edit .env: add SARVAM_API_KEY and optionally MONGODB_URI

# 3. Install all dependencies and start
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KANOON CHHOTA                        │
│                                                         │
│  ┌──────────────┐      ┌───────────────────────────┐   │
│  │   React       │      │    Express + Node          │   │
│  │   (Vite)      │ /api │                            │   │
│  │   Port 5173   │◄────►│    Port 5000               │   │
│  │               │proxy │                            │   │
│  │  - Upload     │      │  POST /api/analyze         │   │
│  │  - Paste Text │      │  POST /api/analyze-text    │   │
│  │  - Lang Select│      │  POST /api/tts             │   │
│  │  - Results    │      │  GET  /api/history         │   │
│  │  - TTS Play   │      │  POST /api/ask             │   │
│  └──────────────┘      └──────────┬────────────────┘   │
│                                   │                     │
│                    ┌──────────────▼────────────────┐   │
│                    │         Sarvam AI APIs          │   │
│                    │                                 │   │
│                    │  Doc AI: /doc-ai/v1/job/        │   │
│                    │  Chat:   /v1/chat/completions   │   │
│                    │  Transl: /translate             │   │
│                    │  TTS:    /text-to-speech        │   │
│                    └──────────────┬────────────────┘   │
│                                   │                     │
│                    ┌──────────────▼────────────────┐   │
│                    │    MongoDB (optional)           │   │
│                    │    Falls back to in-memory Map  │   │
│                    └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Sarvam APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| Document Intelligence | `POST /doc-ai/v1/job/digitise` | OCR: extract text from PDF/image |
| Chat Completions | `POST /v1/chat/completions` | Simplify legal text (model: `sarvam-105b`) |
| Text Translation | `POST /translate` | Translate to Indian languages (model: `mayura:v1`) |
| Text-to-Speech | `POST /text-to-speech` | Read aloud (model: `bulbul:v1`, 2500 char limit) |

**Auth header:** `api-subscription-key`

---

## Assumptions

1. **TTS limit:** Sarvam TTS allows 2500 chars/request. Long text is chunked automatically.
2. **Doc AI:** OCR returns a ZIP with Markdown. We extract `.md` files and concatenate pages.
3. **Language codes:** Using Sarvam's ISO codes (e.g., `hi-IN`, `bn-IN`, `ta-IN`).
4. **LLM model:** `sarvam-105b` on `/v1/chat/completions` — best available for JSON extraction.
5. **Translation model:** `mayura:v1` with `formal` mode for legal documents.
6. **MongoDB is optional:** Falls back to in-memory Map on missing URI or connection failure.
7. **No user auth:** This is a public-access tool; adding auth is a production concern.
8. **Odia code:** Using `od-IN` (may be `or-IN` on some systems — adjust in constants.js if needed).

---

## Project Structure

```
sarvam/
├── .env                    # API keys (git-ignored)
├── .env.example            # Template (safe to commit)
├── .gitignore
├── package.json            # Root: runs both server + client
├── README.md
├── samples/
│   └── eviction_notice.txt # Sample document for testing
├── server/
│   ├── index.js            # Express app entry
│   ├── config.js           # Env config
│   ├── routes/api.js       # All API routes
│   ├── services/
│   │   ├── sarvam.js       # All Sarvam API calls
│   │   ├── analyze.js      # LLM + translation pipeline
│   │   └── db.js           # MongoDB / in-memory abstraction
│   ├── models/Analysis.js  # Mongoose schema
│   ├── middleware/
│   │   └── errorHandler.js
│   └── utils/chunk.js      # Text chunker for TTS
└── client/
    ├── index.html
    ├── vite.config.js      # Proxy /api → :5000
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api.js          # Fetch wrappers
        ├── constants.js    # Languages, sample text, colors
        └── components/
            ├── HomePage.jsx
            ├── ResultPage.jsx
            ├── HistoryDrawer.jsx
            └── Toast.jsx
```

---

## Future Scope

1. **e-Courts Integration** — Direct API connection to eCourts India to auto-fetch case status and next hearing dates linked to a court order.
2. **WhatsApp Bot** — Deploy on WhatsApp Business API so citizens can forward photos of documents and receive plain-language explanations via chat.
3. **Offline Panchayat Kiosks** — Lightweight Electron or PWA wrapper with a local LLM for areas without reliable internet; syncs analysis to cloud when connected.

---

## Legal Disclaimer

This tool provides **plain-language explanations for literacy purposes only**. It is **not legal advice**. For legal help, contact:
- **NALSA Free Legal Aid Helpline: 15100**
- Your nearest District Legal Services Authority (DLSA)
