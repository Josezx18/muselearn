# Software requirements

As-built specification for the web application at the revision identified in the [index](README.md). "Implemented" means present in source, not independently validated in production.

## Functional requirements

| ID | Requirement | Acceptance condition |
|---|---|---|
| FR-01 | Authenticate and route by role | Email/password and optional Google entry; only authorized sessions enter the corresponding private area; recovery opens password reset |
| FR-02 | Record legal acceptance | Current Terms/Privacy version and acceptance time stored by server; outdated acceptance redirects protected-page access |
| FR-03 | Manage classes | Teacher owns create/edit/delete and code renewal; student joins using a normalized six-character code |
| FR-04 | Browse student classes | My classes shows enrolled classes and teacher; class detail lists tasks and own submission state; inaccessible membership yields no detail |
| FR-05 | Manage assignments | Teacher selects class, instructions, deadline, competencies, help level, mode and optional external URL; only owner edits/deletes |
| FR-06 | Track provenance | `origen` records `ia`, `repaso_ia`, `classroom` or null for manual creation independently from completion mode |
| FR-07 | Import Classroom | Teacher OAuth and course permission required; duplicate links avoided; expired tasks skipped and creation quota respected |
| FR-08 | Analyze and schedule | Validated difficulty 1-5, duration, priority, concepts and steps stored per student; weekly blocks generated deterministically using availability |
| FR-09 | Use the tutor | Enrolled student sends messages; streamed hints honor `pistas`, `ejemplos` or `explicacion`; history stays private to the student |
| FR-10 | Submit evidence | Enrolled student sends own text/attachments and optional external confirmation; paths belong to task/student; in-verification or verified work is locked |
| FR-11 | Explain work | Owner answers three questions in sequence by text or transcribed voice; notebook reading reused within session; obsolete sessions rejected after correction |
| FR-12 | Produce report and practice | Concept levels 1-4 include checkable answer evidence; server fixes identity/time; route failure falls back to basic practice; student can add steps to Week |
| FR-13 | Review work | Teacher can view text, images, verification, report and comment, and navigate/filter submissions in a review workspace |
| FR-14 | Assist teacher review | AI suggests compliance, criteria/evidence, strengths, improvements, comment and optional grade; save by submission; reuse matching versions; Review all skips current reviews |
| FR-15 | Give human feedback | Teacher edits/publishes comment, chooses nullable grade 0-100 or returns with required reason; correction permits a fresh verification |
| FR-16 | Summarize understanding | Owner-only class dashboard and student profile show concepts, submission history, punctuality and grade information |
| FR-17 | Assist task design | Teacher reviews AI task proposal, concept-based review activities and comment draft before saving; a suggested activity can become a task |
| FR-18 | Notify and export | Own notifications/read state only; teacher notified on submission; owner downloads class CSV with spreadsheet-formula neutralization |
| FR-19 | Manage own account | Change allowed profile fields; reauthenticate password change; export selected own records; explicit word confirms irreversible deletion |

## Nonfunctional requirements and constraints

| ID | Requirement | Implementation or verification boundary |
|---|---|---|
| NFR-01 | Access isolation | Session/role/ownership checks plus Postgres RLS; admin credentials stay on server |
| NFR-02 | Structured validation | Zod contracts validate API/model structures; endpoint-specific checks are listed in [API reference](08-api.md) |
| NFR-03 | Bilingual mobile UI | Spanish and English; target 380 px without horizontal overflow; device and accessibility tests remain necessary |
| NFR-04 | AI resilience | Configured provider order, one schema correction attempt, text alternative to voice, basic-route fallback |
| NFR-05 | Data minimization | Private attachments and signed URLs; audio transcribed in memory; teacher remains responsible for judging model output |
| NFR-06 | Resource control | Daily limits for tutor messages, started verifications, task creation and teacher assistance; batch review observes shared quota |
| NFR-07 | Recoverability | Persist answers before final evaluation; recover saved report after interrupted closure; reject stale/out-of-order sessions |
| NFR-08 | Operational clarity | No documented SLA, concurrency guarantee or proven RTO/RPO; production backups and provider retention require operational verification |

The runtime uses Next.js App Router, TypeScript, React, next-intl, Supabase and server-only model calls. Mock mode simulates data and responses. No educational efficacy, legal compliance certification or automatic grading accuracy is asserted.

## Traceability

Class and task handlers implement FR-03-07; `src/lib/ia/analizador/` and `planificador/` implement FR-08; `src/lib/ia/conversacion/` implements FR-09-12; teacher components and `src/app/api/docente/` implement FR-13-17. Account, notification and export handlers cover FR-18-19. The [data dictionary](07-data-model.md) and [API catalogue](08-api.md) describe the persistence and authorization contracts.
