# SchedulAI — AI-Powered Timetable Scheduling System

An intelligent timetable generation system using an **Adaptive Genetic Algorithm** with a **Groq AI** assistant for analysis and insights.

## Project Structure

```
├── backend/            # FastAPI Python backend
│   ├── main.py         # API entry point
│   ├── config.py       # Environment / settings
│   ├── test_api.py     # API integration tests
│   └── scheduler/      # Core scheduling engine
│       ├── models.py       # Pydantic data models
│       ├── ga.py           # Genetic Algorithm
│       ├── fitness.py      # Fitness evaluation
│       ├── learning.py     # Pattern learning engine
│       └── ai_assistant.py # Groq AI integration
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # All page components
│   │   ├── components/     # Reusable layout components
│   │   ├── context/        # React contexts (Auth, Schedule, Notifications)
│   │   ├── services/       # API client layer
│   │   ├── data/           # Mock / seed data
│   │   └── lib/            # Supabase client
│   ├── package.json
│   └── vite.config.js      # Dev proxy → localhost:8000
├── .env                # All environment variables (root)
├── requirements.txt    # Python dependencies
└── README.md
```

## Quick Start

### 1. Backend

```bash
# From project root
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Start the API server
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000`.

### 3. Environment Variables

All env vars live in the root `.env` file:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq API key for AI features |
| `AI_MODEL` | LLM model name (default: `llama-3.3-70b-versatile`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Features

- **Adaptive Genetic Algorithm** — population-based optimization with adaptive mutation rates
- **AI-Powered Analysis** — Groq Llama for schedule quality insights, faculty-course fit analysis
- **Learning Engine** — learns from past successful schedules to improve future generations
- **Hard & Soft Constraints** — faculty clashes, room clashes, capacity, workload, preferences, gaps, distribution
- **React Admin Dashboard** — departments, faculty, subjects, rooms, time slots, workload management
- **Timetable Generation & Viewing** — generate, view, and edit timetables
- **Analytics** — faculty workload, room utilization, and scheduling statistics
