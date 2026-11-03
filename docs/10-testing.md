# Testing and verification

Results below were measured on November 3, 2026, in the Windows T26 checkout based on `0d4bc4c`. Documentation-only edits do not change application tests. Counts distinguish discovered tests from completed tests.

## Measured results

| Check | Command | Observed result |
|---|---|---|
| Lint | `npm run lint` | Passed, exit 0 |
| Unit suite | `npm test` | 267 passed, 10 skipped; 277 total across 40 files (39 passed, one skipped); 16.33 seconds |
| Generated route types and TypeScript | `npm run typecheck` | Passed on Linux (Node 22) at `3cede1d`. On the Windows T26 checkout it could not start: Next type generation could not load the SWC native binding |
| E2E inventory | `npx playwright test --list` | 190 test instances in 19 files across desktop and mobile projects |
| E2E run with mocks | `npm run e2e` with mock mode | Linux, November 3 at `0d4bc4c`: 181 passed, 8 skipped (Google sign-in tests that need the feature flag), 1 failed ("an expired link explains what to do"), which passed when re-run alone; it is timing-sensitive under full-suite load. On the Windows T26 checkout the web server did not start (same SWC problem) |
| RLS isolation | `npm run rls` | 214/214 passed, zero failures; local ephemeral PostgreSQL with all 15 migrations loaded |
| Production build | Not run in this session | No new build result claimed |
| Live model / physical audio / real Classroom | Not run in this session | No fresh result claimed |

The SWC error contains a missing native binding and `ERR_SWC_NATIVE_CACHE`: Windows DACL validation rejects the available native-addon cache paths. This is an environment/toolchain startup failure, not an assertion failure. TypeScript checking and E2E completion remain unverified here; lint and unit success do not replace them. Repairing machine permissions or dependencies is outside the documentation assignment.

## Unit suite scope

The suite covers contracts and validators, authentication helpers, task/submission rules, deterministic scheduling, provider routing and schema retry, notebook/verification logic, report evidence, teacher assistance and review normalization, mock state, CSV handling, legal acceptance and student/class summaries. Ten skipped cases are not successes. Optional real-provider cases require explicit opt-in/configuration and fictional data.

## Browser suite scope

`playwright.config.ts` defines Desktop Chrome (`escritorio`) and Pixel 7 (`celular`) projects. The 190 discovered instances include role workflows, weekly navigation, student profiles/classes, submission review and batch AI review, voice preferences/recovery, localization and axe/layout checks. Browser tests with mocks exercise simulated UI flows; they do not prove Supabase persistence, actual provider performance or microphone recognition.

Reproduce with PowerShell in an isolated port:

```powershell
$env:NEXT_PUBLIC_USAR_MOCKS = 'true'
$env:PLAYWRIGHT_PORT = '3026'
npm run e2e
```

Install the configured Playwright browser first if absent. `CHROMIUM_PATH` may point to an installed compatible browser. Test discovery can be reproduced independently with `npx playwright test --list` and does not start the app.

## RLS suite scope and limits

`scripts/probar-rls.mjs` creates a temporary loopback-only PostgreSQL cluster, prepares minimal Auth/Storage roles, reads every numbered SQL migration in order and loads fictional two-teacher/three-student/two-class fixtures. Each case uses its database role and user ID in a transaction followed by ROLLBACK. Only SQLSTATE 42501 counts as the expected authorization denial; syntax or constraint failures are not accepted as RLS success. The server is stopped afterward.

The Windows default binary path is PostgreSQL 18; override with `RLS_PG_BIN` when necessary. The harness banner still says "10 migrations"; inspection of its directory-based loader and this checkout confirms all 15 migration files were applied. The 214 cases are the existing finite isolation matrix, not 214 new tests of migrations 0012-0015. In particular, the newer saved-review policy needs dedicated negative/positive cases before claiming complete new-feature RLS coverage. This run did not contact production Supabase.

## Documentation validation

The documentation audit compares the API table with every exported route method (61 methods across 46 route files), builds a dictionary of 18 tables/99 columns from migrations and verifies relative Markdown links and image targets. It checks removal of `docs/proyecto/`, English filenames and absence of links to private work-management material. Mermaid blocks are provided for GitHub rendering; a local GitHub renderer was not executed.

## Remaining verification

After repairing SWC, rerun typecheck, build and the full mocked browser suite. Separately exercise two authenticated roles against a dedicated Supabase environment, including saved reviews after reload, return/resubmission, teacher notification, account export/deletion and actual Classroom import. Physical camera, microphone, handwriting and browser speech behavior require device testing. Use fictional accounts such as `student@muselearn.demo`; keep credentials in local environment configuration.

See [Operations](11-operations-deployment.md) for environment setup and [Security](09-security-privacy-ai.md) for interpretation limits.
