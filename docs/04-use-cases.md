# Use cases

Actors are the teacher, student, Supabase authentication/storage/database and optional Google/model providers. Teachers retain responsibility for published feedback and assessment.

## UC-01 - Register, recover access and accept terms

Choose a role and register with name, email and password, or use Google when enabled. Existing Google users retain their stored role. Recovery email returns through `/api/auth/callback` using PKCE or a recovery token hash and opens the new-password page. Protected pages request acceptance when the stored Terms/Privacy version is missing or old. Invalid/expired links return to a controlled error screen.

## UC-02 - Create or join a class

An authenticated teacher creates a class and shares its six-character code. A student enters the code; the server checks student role, existence and duplicate membership. Existing pending tasks are analyzed in background for the new member. The student sees the class in My classes and opens its task list. A teacher can renew the code or remove membership; students can leave their own enrollment. Removing enrollment preserves submissions.

## UC-03 - Assign work

The teacher enters title, instructions, deadline, competencies and tutor help level, then selects MuseLearn, notebook, Classroom or another platform. An external URL tells the student where to work. Alternatively, Create with AI fills a proposal for teacher review. Saved tasks trigger student notices and per-student analysis/planning. Origin badges identify AI proposals, AI review practice and imported work; mode remains independent.

For Classroom, connect Google, select an authorized course and import. Existing links avoid duplicates. Only upcoming supported work is imported, up to ten new tasks per import and within the daily creation allowance. Missing task permissions can leave class/student import successful while reporting the task-permission issue. Disconnect removes the local connection.

## UC-04 - Plan and learn

The student consults Today or Week, opens the explanation of task priority and marks blocks done or skipped. Reorganize recalculates the schedule. In a task, the tutor guides the student according to the teacher's help level. Voice mode has recording feedback and speech settings; text remains available if permissions, ASR or playback fail. The tutor does not submit the assignment.

## UC-05 - Submit and demonstrate

The student writes or uploads work, including notebook photos. For external tasks, the student delivers on the external platform and confirms that action in MuseLearn while supplying evidence. The teacher receives a new-submission notice.

The student starts verification. Notebook images are read once and cached in the session. Three questions ask about the student's reasoning; answers can be typed or transcribed and edited. On completion, a report presents concept levels, evidence, strengths and gaps, with a practice route. Finish closes the completed verification flow. Practice steps can be added to the weekly plan. If final evaluation fails, the saved answer permits retry; a saved report can recover interrupted closure.

## UC-06 - Review, grade and return

From task submissions, the teacher filters/sorts and opens a student in the review workspace. The workspace places submitted work and image viewing beside verification/report and feedback. Previous/next controls support reviewing the class. Review with AI suggests task compliance, criterion evidence, criterion-based feedback, improvements and optionally a grade; the teacher decides what to apply.

Review all processes submitted work lacking a current saved review, two requests at a time. It stops scheduling more work on quota exhaustion and reports failures. Reviews persist by submission timestamp; a resubmission invalidates the earlier version. If saving fails, the individual endpoint can still return the review, so reloading is needed to confirm persistence.

The teacher publishes an edited comment, optional 0-100 grade, or returns the submission with a reason. Return resets its state to pending. The student corrects and resubmits; the previous grade is retained while the return flag is cleared. A fresh verification replaces the report; obsolete sessions cannot be resumed.

## UC-07 - Turn evidence into follow-up

The teacher compares submitted versus understood in the dashboard, opens concept heatmaps and a student's class profile, or asks AI for review activities based on concept aggregates. A selected activity becomes an editable assignment with AI-review origin. Submission and understanding CSVs support offline analysis. The student reads notifications and the report, then practices weak concepts.

## UC-08 - Export or delete an account

In profile settings, export selected account records to JSON. The current implementation exports an explicit set of tables, not every newer table. To delete, type DELETE (or ELIMINAR). Storage cleanup precedes Auth deletion and database cascades. A teacher account deletion also removes owned classes, tasks and student work within them. See [Security and privacy](09-security-privacy-ai.md).
