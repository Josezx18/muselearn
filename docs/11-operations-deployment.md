# Operations and deployment

This is a repository-based runbook. It does not assert that production migrations, secrets, backups or OAuth settings were checked during this documentation session.

## Local setup

Use Node.js 22 or newer and npm. Install the repository dependencies with `npm install`, copy `.env.example` to `.env.local` and fill values locally. Keep `NEXT_PUBLIC_USAR_MOCKS=true` for a simulated interface without real model calls. Run `npm run dev` and open `http://localhost:3000`; choose Spanish or English. To exercise persistence and models, configure the required services and disable mock mode.

Do not commit `.env.local` or put server credentials in a public-prefixed variable. The example environment contains variable names and public endpoint defaults, not usable credentials.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client configuration; authorization depends on user session and RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret server credential that bypasses RLS |
| `MODEL_API_KEY` | Secret Meta model/transcription credential |
| `META_API_URL`, `MUSE_MODELO`, `MUSE_VOZ_MODELO` | Meta endpoint and model IDs; source defaults in the [architecture](05-architecture.md) |
| `MODELO_ABIERTO_URL`, `MODELO_ABIERTO_KEY`, `MODELO_ABIERTO_ID` | Open-provider endpoint, secret credential and model; all three required to configure it |
| `NVIDIA_API_KEY`, `NVIDIA_API_URL`, `NVIDIA_MODELO` | Optional analysis/planning fallback credential and settings |
| `ZONA_OFFSET_MIN` | School time offset in minutes; default -240; used in planning, daily counters and CSV dates |
| `NEXT_PUBLIC_USAR_MOCKS` | Public build-time selection of simulated data/responses |
| `LIMITE_TUTOR_DIA` | Tutor messages per student/day; default 60 |
| `LIMITE_VERIFICACIONES_DIA` | Verification starts per student/day; default 10 |
| `LIMITE_TAREAS_DIA` | New tasks per teacher/day; default 20 |
| `LIMITE_IA_DOCENTE_DIA` | Shared teacher assistance/review actions per day; default 40 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Classroom OAuth client and secret |
| `NEXT_PUBLIC_ENTRAR_CON_GOOGLE` | Show Google sign-in after separately configuring the provider in Supabase |

The browser-visible flags are compiled into the client; rebuild/redeploy after changing them. Do not assume a configured fallback supports images: notebook reading uses Meta only.

## Database and demonstration data

Apply SQL migrations 0001-0015 in lexical order to the intended Supabase project. They define 18 application tables, RLS, private buckets, helpers and the return RPC. There is no 0016 file at the reviewed local main revision. See the [migration ledger](07-data-model.md).

Recent migrations add assignment origin (0012), teacher submission notices (0013), notebook-session caching (0014) and saved teacher AI reviews (0015). Missing 0015 causes saved-review GET to return an empty list; POST can return a review even when persistence fails. Verify saved reviews survive reload rather than treating an on-screen result as persistence evidence.

Use a dedicated test Supabase project for seed scripts. Keep only fictional identities such as `teacher@muselearn.demo`; supply any required demonstration password through the local environment. Review the seed documentation and target before invoking `npm run seed:auth` or database seed SQL. No remote seed or migration was applied by this documentation task.

## Authentication and Google configuration

Configure Supabase Site URL and allowed redirects for each environment. Google sign-in through Supabase returns via `/api/auth/callback`; recovery uses the same application callback and opens `/[locale]/nueva-contrasena`. Confirm the email template and recovery-token/PKCE flow in the target deployment, including expired-link handling.

Classroom uses a separate Google web OAuth client with redirect `https://<application-host>/api/integraciones/classroom/callback`. Its cookie settings are Secure and HttpOnly, so test the integration over HTTPS. The scopes are read-only courses/rosters/coursework plus profile email access. Tokens are short-lived and reconnection may be required; disconnect only deletes the local cookie. Configure Google's consent/testing access for the intended accounts.

## Validation and deployment

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
npm run rls
```

Set mock mode explicitly for browser tests and isolate the port as described in [Testing](10-testing.md). RLS testing uses temporary local PostgreSQL and does not read production credentials. `npm run prueba:ia` calls real providers and consumes credits; use fictional prompts and configured credentials deliberately.

For Vercel, install dependencies, configure environment-specific public values and server secrets, verify the target database migration set, configure Auth/OAuth redirects, build and deploy the authorized revision. Smoke-test public/legal pages plus authenticated teacher/student flows. Confirm the current legal acceptance version is recorded, a student can submit/verify, the teacher receives a notice, and saved reviews can be reopened.

## Monitoring, recovery and known operational limits

Watch failed background analysis/replanning, model latency/errors, quota responses and Storage cleanup warnings. `after()` work is not a durable external job queue. Some handlers allow up to 120 or 300 seconds; hosting time limits must support the chosen deployment. Logs include model/provider/token counts and bounded errors; apply an appropriate access and retention policy without logging student work.

Establish and test database/Storage backup and restoration procedures. Database cascades do not automatically clean object storage. A teacher account deletion removes class-related student work, so assess the intended organizational recovery policy before real deployment. No complete repository-defined SLA, RTO/RPO, automatic key rotation or rollback process is claimed. Verify those procedures in the hosting and database providers.

On the current Windows machine, SWC native-addon cache permission validation prevents Next type generation and browser-server startup. Lint, unit and local RLS checks passed; see [exact results and limits](10-testing.md). Fix the local toolchain and rerun blocked checks before treating this revision as fully verified.
