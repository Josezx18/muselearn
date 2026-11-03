# Product vision and PRD

MuseLearn is a bilingual web application for secondary-school teachers and students. Its central premise is that **submitting homework does not by itself demonstrate understanding**. The application connects planning, guided learning, submission, explanation and targeted practice, giving teachers evidence beyond completion counts.

## Problem and users

Students need to prioritize deadlines, obtain useful hints and recognize what to practice. Teachers need to distinguish completed work from understanding and respond while a learning gap is still actionable. These are product hypotheses, not claims established by a user study.

| User | Need | Product response |
|---|---|---|
| Student | Know what to study next | Today and a weekly plan with task analysis and study blocks |
| Student | Get help without bypassing learning | Socratic tutor constrained by the teacher's help level |
| Student | Explain work in an accessible way | Text or voice verification grounded in the submitted work and notebook photos |
| Teacher | See who understands each concept | Evidence-based reports, concept heatmap and student profile |
| Teacher | Act on gaps efficiently | Review workspace, optional grades, returns, comments and AI practice suggestions |

There are two application roles, `docente` and `estudiante`; no separate institution administrator role is implemented.

## Value and current capabilities

The learning cycle is **organize -> learn -> submit -> demonstrate -> improve**. A task triggers analysis and planning without requiring the student to ask a chatbot. The tutor is one component of this workflow.

Teachers create classes and share enrollment codes, create tasks manually or from AI proposals, or import from Google Classroom. Tasks specify competencies, a due date, help level and completion mode: MuseLearn, notebook, Classroom or another platform. Origin labels distinguish AI proposals, AI review practice and Classroom imports from manually created work.

Students see Today, Week and My classes, submit text or attachments, explain their reasoning and receive concept levels plus practice steps. Teachers review submissions in a workspace with image viewing, navigation between students, saved AI reviews and Review all. They can comment, assign an optional grade or return work. Class dashboards compare submission with understanding; student profiles show history, punctuality, grades and concepts. Notifications and CSV exports support follow-up.

Account features include email/password, optional Google sign-in, password recovery, versioned Terms and Privacy acceptance, data export and account deletion. The interface supports Spanish and English.

## Goals and measures

1. Help students allocate time and complete the learning cycle.
2. Provide guidance without solving the assigned exercise.
3. Ground understanding reports in checkable student answers.
4. Preserve teacher control over feedback and assessment.
5. Support mobile use and minimize student data exposure.

Proposed measures include completed study blocks, verification completion, time to visible analysis, changes in concept levels and teacher acceptance of drafts. The repository provides no longitudinal evidence of learning gains or validated grading accuracy. Automated test results are described in [Testing](10-testing.md).

## Product principles

AI outputs are fallible assistance. A teacher reviews proposals, comments, suggested grades and practice before taking action. Understanding levels are not proof of authorship or a cheating verdict. External delivery confirmation does not submit work to Google. Student text and images are untrusted input to the model. Mock demonstrations must be identified as simulated.

See [MVP scope](02-mvp-scope.md), [requirements](03-software-requirements.md) and [privacy and AI](09-security-privacy-ai.md).
