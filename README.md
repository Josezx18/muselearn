# MuseLearn

**An AI study companion that plans each student's week, tutors without doing the homework, and checks that the student really understood.**

Built for the **Meta AI Developer Hackathon 2026** — Indie track, theme *Build for Your World*.

> *Español:* MuseLearn es una plataforma para docentes y estudiantes de secundaria. La interfaz está en español e inglés.

---

## Why

I teach technology at a public secondary school in the Dominican Republic. My students juggle many subjects, and AI chatbots now make it easy to hand in work they don't understand. Teachers find out too late — at the exam.

MuseLearn keeps the classroom flow teachers already know (classes, tasks, submissions) and adds an agent that works **for learning, not around it**.

## What it does

| | For the student | For the teacher |
|---|---|---|
| **1. Plan** | Each new task is analyzed (difficulty, minutes, priority, concepts) and the week is re-planned around the student's real schedule. *Today* shows what to do now. | Sees which tasks will be hard for whom before the due date. |
| **2. Tutor** | A Socratic tutor answers with questions and hints at the help level the teacher chose — it **never solves the task**. | Chooses the help level per task: hints, worked examples, or explanation. |
| **3. Verify** | After submitting — including **photos of the handwritten notebook** — the student answers 3–5 short questions about *their own* work, by **voice** or text. | Gets a comprehension report per student and concept, not just "submitted". |
| **4. Improve** | A personalized practice route of 2–6 steps for the weak concepts. | A **heatmap** (student × concept) with the concepts the class needs to review. |

### Why it is not "another chatbot"
- The agent acts on its own when something happens (new task, submission, missed study block) instead of waiting for a prompt.
- Its output is a **plan, a verification and a report**, not a chat transcript.
- It reads the student's real work — including handwriting from notebook photos — and asks about specific steps ("in line 3 you wrote…").

## Built on Meta models

| Job | Model | Where |
|---|---|---|
| Socratic tutor, comprehension questions, reading notebook photos, report and route | **Muse Spark 1.3** | Meta Model API |
| Voice answers (speech to text, Spanish/English) | **Muse Voice Transcribe 1.0** | Meta Model API |
| Batch task analysis and weekly planning | **Muse Spark Open** (open weights) | Baseten · Modal |
| Fallback | **Muse Glimmer 30B** | NVIDIA |

Every call goes through one client (`src/lib/ia/cliente.ts`) that picks the provider per job, validates the JSON output against Zod schemas, retries once and falls back to the next provider.

## Stack

- **Next.js 16** (App Router, React 19) · TypeScript · Tailwind CSS 4 · `next-intl` (es/en)
- **Supabase**: Postgres with Row Level Security, Auth, Storage (private buckets for attachments and audio)
- Vitest and Playwright for tests
- Mobile-first: everything works at 380 px wide, so students can use their phones

## Status

Work in progress during the hackathon (Oct 27 – Nov 4, 2026).

- [x] Teacher and student accounts, roles, classes with a 6-character join code
- [x] Tasks with attachments; submissions with text, files and notebook photos (compressed on the phone)
- [x] AI task analysis and weekly planner with automatic re-planning
- [ ] Socratic tutor and voice/notebook comprehension verification
- [ ] Student dashboard (*Today*, *Week*)
- [ ] Teacher comprehension heatmap and reports
- [ ] Public deployment and demo video

## Run it locally

Requirements: Node.js 22+, a Supabase project and a Meta Model API key.

```bash
npm install
cp .env.example .env.local      # fill in the keys (never committed)
npm run dev                     # http://localhost:3000
```

- **No keys yet?** Keep `NEXT_PUBLIC_USAR_MOCKS=true` in `.env.local` and the UI runs on sample data.
- `npm run prueba:ia` — checks that each AI provider in `.env.local` answers.
- `npm run seed:auth` — creates fictional demo users and a demo class.
- Database schema and RLS policies: `supabase/migrations/`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Privacy

- Only fictional data in this repository and in the seeds.
- Each student sees only their own work; teachers see only their own classes (enforced by RLS in the database, not just in the UI).
- Verification audio is deleted after transcription.
- Student data is never sent to Meta's *Contributor* tier.

## How it was built

All product code was written during the hackathon build period, starting **October 27, 2026**.

I designed the architecture and the contracts (types, API and database schema) first, then built the pieces in parallel with AI coding agents (Claude Code, Codex, OpenCode), each working on its own branch with strict file ownership, and integrated and reviewed every piece myself. The design documents, task sheets and the prompts used by the app's own agents are in [`.orquesta/`](.orquesta/).

## Author

**José Enrique Ulloa** — technology teacher, Dominican Republic.
