# Figmenta Discord Copilot (Admin-Controlled Agent)

![Project Banner](https://img.shields.io/badge/Status-Live-green) ![Tech](https://img.shields.io/badge/Built%20With-Next.js%20%7C%20Supabase%20%7C%20Gemini-blueviolet)

## 📋 Project Overview
This project is a submission for **Figmenta Internship Brief**. It is a full-stack AI agent system consisting of two parts:
1.  **The Brain (Admin Dashboard):** A "Neural Interface" web app where the admin configures the bot's personality and manages its memory.
2.  **The Body (Discord Bot):** A Node.js bot that connects to Discord, retrieves its instructions from the database, and converses using Google Gemini 1.5 Flash.

### 🌟 Key Features
*   **Dynamic System Instructions:** Change the bot's personality instantly from the dashboard without restarting the server.
*   **Persistent Contextual Memory:** The bot remembers previous conversations. Memory is stored in Supabase and retrieved for every new message.
*   **Live Memory Stream:** The Admin Dashboard shows the bot's "thought process" (conversation summary) in real-time using Supabase Realtime.
*   **Memory Control:** Admins can wipe the bot's memory via a secure "Format Drive" action.
*   **Security:** Row Level Security (RLS) enabled. Only the bot owner can modify settings.
*   **Robust Architecture:** Hybrid sync system (Realtime + Polling fallback) ensures the UI never falls out of sync.

---

## 🛠️ Tech Stack

### Web Dashboard (The Architect)
*   **Framework:** Next.js 15 (App Router)
*   **Database & Auth:** Supabase
*   **Styling:** Tailwind CSS + Shadcn UI
*   **Icons:** Lucide React

### Discord Bot (The Executive)
*   **Runtime:** Node.js
*   **Library:** Discord.js v14
*   **AI Model:** Google Gemini 1.5 Flash (via `@google/generative-ai`)
*   **Logic:** JSON Mode enforcement for structured memory updates.

---

## 🚀 Setup Instructions

### Prerequisites
*   Node.js installed.
*   A Supabase project.
*   A Google AI Studio API Key (Gemini).
*   A Discord Bot Token.

### 1. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor to set up the config table:

```sql
create table agent_config (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null unique,
  system_prompt text default '',
  allowed_channel_ids text default '',
  conversation_summary text default '',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table agent_config enable row level security;
create policy "Owner manages everything" on agent_config for all using (auth.uid() = owner_id);

-- Enable Realtime
alter table agent_config replica identity full;


### 2. Environment Variables
Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file in the `bot/` directory:
```bash
DISCORD_TOKEN=your_discord_bot_token
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Running the Project

**Start the Web Dashboard:**
```bash
npm install
npm run dev
# Open http://localhost:3000
```

**Start the Discord Bot:**
```bash
cd bot
npm install
node index.js
```

---

## 🧠 Technical Decisions & "Vibe Coding"
To prioritize reliability and speed (as per the brief), several architectural decisions were made:

1.  **Stable AI Model:** Switched from `gemini-flash-latest` (experimental) to `gemini-1.5-flash` (stable) to avoid "429 Too Many Requests" errors and ensure consistent uptime during evaluation.
2.  **JSON Mode:** The bot forces Gemini to output responses in JSON format. This prevents the "memory parsing" errors common with raw text LLM outputs, ensuring the database never gets corrupted data.
3.  **Hybrid Realtime:** The dashboard uses Supabase Realtime for instant updates but includes a 5-second polling fallback. This ensures that even if a corporate firewall blocks WebSockets, the Admin UI remains functional.
4.  **No React Compiler:** Deliberately chose standard React hooks over the experimental React Compiler to maximize stability and minimize hydration errors during the review process.

---

## 📂 Project Structure
```
├── bot/                # The standalone Discord Bot logic
│   ├── index.js        # Main entry point for the bot
│   └── package.json    # Bot dependencies
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── dashboard/  # Protected Admin Route
│   │   └── page.tsx    # Login Page
│   ├── components/ui/  # Shadcn UI components
│   └── lib/            # Supabase client utilities
└── public/             # Static assets
```