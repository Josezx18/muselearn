# MVP scope

The minimum useful outcome is a complete loop: a teacher assigns work, a student plans and studies, submits evidence and explains it, then receives practice while the teacher sees concept-level evidence.

## Included in the current application

| Area | Implemented scope |
|---|---|
| Identity | Teacher/student registration, login/logout, optional Google sign-in, recovery and profile preferences |
| Consent and data rights | Public Terms and Privacy pages, versioned acceptance, JSON export and confirmed account deletion |
| Classes | Enrollment codes, membership management, student My classes and per-class task list |
| Assignments | Manual or AI-assisted creation, edit/delete, competencies, help level, attachments, modes and origin labels |
| Classroom | Optional OAuth connection; import class, matching/enrolled students and upcoming tasks; disconnect |
| Organization | Student-specific analysis, deterministic weekly scheduling, Today/Week, status updates and practice blocks |
| Learning | Streaming Socratic tutor; text and voice interface with animated companion and recording waveform |
| Evidence | Text, PDFs/images, up to four notebook photos through the student form, external-delivery confirmation |
| Verification | Three sequential questions in the normal flow, cached notebook reading, evidence-checked report and practice route |
| Teacher response | Concept dashboard, student profile, submission/image workspace, individual or batch saved AI reviews, comments, optional 0-100 grade and returns |
| Follow-up | In-app notifications including new submission to teacher; submission and understanding CSV exports |
| Presentation | Spanish/English, mobile layouts and accessibility checks in the test suite |

Implementation is not a claim that every third-party integration or physical device was validated in this documentation session. See [Testing](10-testing.md).

## Boundaries

The application does not deliver a student's work to Classroom. Students follow the external link, deliver there themselves and record evidence/confirmation in MuseLearn. Automatic PDF text extraction is not part of the notebook vision workflow. There is no native mobile app, institutional administrator, general-purpose MCP server, push notification service or guaranteed handwriting/transcription accuracy.

AI reviews and understanding levels do not automatically publish grades or disciplinary decisions. Review all uses the same per-submission endpoint, two requests at a time, and shares the teacher quota. Saved reviews are reused only for the current submission timestamp.

## Demonstration acceptance

A release demonstration should cover both roles with fictional accounts, persisted work, a return/resubmission cycle, permission isolation and a text alternative to voice. Verify consent, exports, deletion consequences and external-service configuration. Separately test physical camera/microphone behavior and an actual Classroom account. A mock walkthrough proves interface behavior rather than production persistence or model quality.

See [Use cases](04-use-cases.md) for the workflows and [Operations](11-operations-deployment.md) for setup.
