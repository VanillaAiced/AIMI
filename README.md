# AIMI — Academic Timetabling

This repository is a Django backend and React frontend application for managing academic resources and generating course schedules.

Quick start
1. Backend (Python/Django)
	- Create and activate a virtualenv (Python 3.11+ recommended).
	- Install dependencies: `pip install -r requirements.txt`.
	- Apply migrations: `python manage.py migrate`.
	- (Optional) Create a superuser: `python manage.py createsuperuser`.
	- Run dev server: `python manage.py runserver`.

2. Frontend (React)
	- Install node deps: `cd frontend && npm install`.
	- Run dev server: `npm start` (in `frontend`)
	- Create production build: `npm run build` (outputs to `frontend/build`)

API notes / recent changes
- The legacy `CourseOffering` model and `/api/course-offerings/` endpoint were removed. Use `curricula` to link `course`s to `block`s instead.
- The `YearLevel` model was removed from the code and database.
- `Professor.availability` was removed; professors are assumed available by default.
- Scheduler: POST `/api/schedule-entries/generate/` triggers schedule generation. The scheduler enforces hard constraints (no overlaps for block/professor/room; room & professor requirements; duration & frequency) and applies optional heuristics (avoid very early/late, reduce gaps, prioritize higher-unit courses).

Testing
- Run backend tests: `python manage.py test` (from `backend` folder).

Troubleshooting
- If frontend still references removed endpoints, rebuild the frontend: `cd frontend && npm run build`.
- After model changes, run `python manage.py makemigrations` and `python manage.py migrate`.

If you want I can add a data-migration to convert legacy `CourseOffering` rows into `Curriculum` links.
EXPECTED SITE FLOW

User opens system

User completes payment

User uploads / inputs scheduling data

System validates data

System generates initial schedule

System resolves conflicts

AI analyzes the schedule

User reviews, accepts, or regenerates

User exports final schedule

---

SCREEN-BY-SCREEN STORYBOARD

Screen 1: Landing Page

User sees:

Project title (AIMI Smart Schedule Optimizer)

Short description

"Start Scheduling" button

User action: Clicks Start Scheduling

## System action: Redirects to Login Screen (if not already Logged in)

Screen 2: Login

Username/Email

Password

System actions:
Verify Login

## Redirect to Data Input Dashboard

Screen 3: Data Input Dashboard

User sees tabs or sections for:

Subjects

Professors

Rooms

Class Code

Block

User actions:

Fill up forms OR upload CSV files

Click "Validate Data"

System actions:

Checks missing fields

Checks invalid time ranges

## Stores validated data in database

Screen 4: Schedule Generation

User sees:

"Generate Schedule" button

## System action: Redirects to payment screen

Screen 5: Payment Gate (PayPal)

User sees:

Explanation of why payment is required

PayPal checkout button

User action: Completes payment

System action:

Verifies payment via PayPal API

Grants access token / session

No payment = no schedule generation

Loading indicator

Backend process:

Sort subjects by priority

Apply greedy algorithm

Assign time, room, professor

Data Structures involved:

Priority Queue (subject priority)

## Hash Maps (availability lookup)

Screen 6: Conflict Detection & Resolution

System (not user-facing):

Detects conflicts using graphs

Applies backtracking when constraints fail

Enforces 12-hour max campus stay

Output:

## Feasible schedule OR regeneration attempt

Screen 7: Schedule Preview

User sees:

Timetable view (per section / professor)

Highlighted inefficiencies (optional)

User actions:

Accept schedule

Regenerate

## Request AI analysis

Screen 8: AI-Assisted Analysis

System action:

Sends schedule summary to LLM

Receives insights such as:

Long gaps

Uneven workload

Room underutilization

User sees:

Human-readable suggestions

## "Apply suggestions" (optional / advisory)

Screen 9: Finalization & Export

User actions:

Confirm final schedule

Export as PDF / CSV

System actions:

Locks schedule

Generates downloadable file

---

SYSTEM SCOPE

Primary User: Faculty staff / Department coordinator
Goal: Generate an optimized, conflict-free academic schedule

System Modules:

Frontend (React)

Backend (Django REST)

Scheduling Engine (Algorithms)

AI Analysis Layer

Payment (PayPal)

Database (PostgreSQL)
