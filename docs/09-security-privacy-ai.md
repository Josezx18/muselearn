# Security, privacy and AI

This is an implementation description, not a legal compliance certification or an external penetration test. Source references are `src/lib/db/`, `src/lib/ia/`, authentication components/actions and migrations 0001-0015.

## Authentication and authorization

Supabase Auth manages credentials and sessions. The application stores teacher/student profiles and keeps the role in server-controlled app metadata for routing. Google sign-in is optional and distinct from connecting Classroom. The authentication callback exchanges a PKCE code or verifies a recovery token hash; existing profile roles are preserved.

Private operations combine session/role checks, resource ownership or enrollment and RLS. The service-role client bypasses RLS and therefore must remain server-only behind explicit authorization. The [data dictionary](07-data-model.md) lists policies for every table. Students do not read another student's work or teacher AI reviews; teachers do not have an RLS policy to read private tutor chats. Migration 0011 blocks reassignment of an existing submission to another task/student and requires enrollment on student updates.

Profile UPDATE grants cover only name, language, theme and companion. Role and legal acceptance cannot be directly changed through those grants. Notifications allow an owner to update only the read flag. Server RLS helper execution is restricted; the return RPC is executable only by service_role.

## Browser request protections

Server-managed session cookies use HttpOnly, SameSite=Lax and Secure in production. The API proxy checks state-changing requests: an Origin must match the first forwarded host (or Host); a null or invalid Origin is rejected. Without Origin, Sec-Fetch-Site must be absent, same-origin or none. GET, HEAD and OPTIONS pass this origin check. This is an additional CSRF boundary, not a replacement for endpoint authentication or authorization.

Configured response headers deny framing, disable MIME sniffing, set a strict-origin-when-cross-origin referrer policy and restrict camera/microphone to self while disabling geolocation, payment and USB. HSTS is configured for two years. The partial CSP sets frame-ancestors, base-uri and object-src; it does not restrict script sources. Notification links are accepted only as internal paths in the bell component. See the repository's security policy for vulnerability reporting.

## Terms and privacy acceptance

Public localized Terms and Privacy pages accompany versioned acceptance. `TERMINOS_VERSION` is `2026-10-29` in this revision. The server stores `terminos_version` and `terminos_aceptados_en`; protected-page authorization redirects users whose acceptance is missing or outdated. Selected compatibility paths tolerate databases predating these columns, so deploying the complete migration set matters. This page gate should not be described as universal endpoint-level enforcement of consent.

Before use with actual students, the operator must establish the relevant school/family authorization and applicable legal basis. The repository alone does not establish that those arrangements are complete.

## Data handled and external processing

| Data | Storage / processing |
|---|---|
| Profile and class membership | Supabase Auth and application Postgres records |
| Assignments and student work | Postgres text/JSON plus private attachment objects |
| Tutor messages | Student-specific saved conversations; relevant recent context sent to configured model |
| Notebook photos | Private attachments; authorized server reads send image content to the Meta vision route |
| Verification | Questions, text/transcripts, cached notebook reading, reports and practice routes in Postgres |
| Teacher feedback | Comments, optional grades/returns and separate saved advisory AI reviews |
| Audio | Validated and sent for Meta transcription in memory; current application does not persist the audio |
| Classroom access | Short-lived HttpOnly Secure cookie, not a database token record |

Private attachment URLs expire; `/api/archivos` checks access before issuing a five-minute signed URL. Upload handlers validate size/type, and submission metadata paths must belong to the current task/student. AI review checks ownership before using the admin client to download only stored submission image paths. It does not fetch an arbitrary student-supplied remote image URL.

No automatic audio-retention cleanup job is implemented merely because the old audio bucket comment mentions seven days. Not storing audio in MuseLearn does not establish the external provider's retention policy. Confirm provider contracts, tier, data region and retention separately. The project prohibits using the Meta Contributor tier for student data.

## Data export and deletion

The authenticated JSON export uses own-ID filters and session RLS. Students receive profile/account, enrollments, submissions, analyses, plans, preferences, tutor conversations, verification sessions, reports and teacher comments. Teachers receive profile/account, owned classes/tasks and comments they wrote. This is an explicit export list: it currently omits newer records such as grades, notifications, saved AI reviews and integration links. Query failures can be logged and replaced with empty lists. Do not promise an exhaustive successful export solely from a downloaded JSON file.

Deletion requires typing DELETE or ELIMINAR. Storage cleanup runs before Auth-user deletion, which cascades through the profile and related tables. Deleting a teacher also deletes owned classes, tasks and their students' submissions in those classes. Some Storage cleanup errors are logged without aborting account deletion, so residual-object cleanup may require operator follow-up. The flow is irreversible in the application; backup restoration is an operational concern.

Class CSV exports require teacher ownership. They use UTF-8 BOM, semicolon separators, configured school time offset and formula neutralization for spreadsheet safety.

## Classroom boundary

Classroom requests read-only course, roster, email and student-coursework scopes. OAuth uses random state, a ten-minute state cookie and an online access token with limited lifetime. It imports classes, students and upcoming tasks; it does not submit work to Classroom or synchronize grades back. Disconnect removes the app cookie; Google consent revocation is a separate account action. Do not conflate Google sign-in through Supabase with this optional course-data permission.

## AI safeguards and limitations

The central gateway applies common tutor/assessment rules and Zod validation. Student work is untrusted data rather than system instructions. The tutor's permitted help is selected by the teacher; prompts instruct it to guide without completing the assignment. Prompt rules and schema validity do not guarantee a correct educational answer or immunity to injection.

Understanding reports use checkable excerpts from student answers. Code fixes report identity/time and validates evidence; levels 1-4 are pedagogical indicators, not proof of authorship or a cheating verdict. Teacher review considers task instructions, submitted text and available images, returns a normalized advisory review and never publishes a grade by itself. PDF filenames/MIME metadata are not equivalent to reading PDF contents. The teacher verifies all suggestions before applying them.

Daily quotas reduce accidental or abusive model spending; teacher review shares the teacher-assistance quota. Provider fallback can change the processor receiving a request; the exact order is in [Architecture](05-architecture.md). Logs include provider/model/token counts and error summaries. Operational review is still needed to ensure provider errors and logs do not reveal sensitive content.

## Verification boundaries

The current session passed 214 local RLS cases after loading all migrations, but the cases are a finite suite and do not cover every policy of the newest review table. No remote authenticated security audit, legal review or real-student trial was performed. See [Testing](10-testing.md).
