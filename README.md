


# ClassCatch

ClassCatch is a web-based learning platform for students to catch up on missed lessons.

## Project Structure

```text
class-catch/
├── backend/   # Laravel API
├── frontend/  # Angular application
└── README.md
```

## Step 1 Status

Completed:

- Backend and frontend folders created.
- Laravel installed in `backend/`.
- Angular installed in `frontend/`.
- MySQL configured.
- Initial database migrations created and run.
- Database connectivity verified.

## Step 2 Status

Completed:

- Laravel Sanctum installed and configured.
- User model updated with API tokens and role support.
- Registration endpoint implemented.
- Login endpoint implemented.
- Logout endpoint implemented.
- Authenticated user endpoint implemented.
- Only `teacher` and `student` roles are supported.
- API endpoints tested successfully.

## API Endpoints

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout` (requires Bearer token)
- `GET /api/user` (requires Bearer token)

## Backend Setup

Requirements:

- PHP 8.3+ CLI (run `php -v` to confirm the CLI version; XAMPP's PHP may be older)
- Composer
- MySQL/MariaDB

Commands:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=classcatch
DB_USERNAME=root
DB_PASSWORD=
```

Start MySQL from the XAMPP Control Panel and create the `classcatch` database before migrating. Ensure PHP 8.3+ is ahead of XAMPP's PHP in your command-line `PATH`, then reopen the terminal.

Run:

```bash
php artisan migrate
php artisan serve
```

Backend URL: `http://127.0.0.1:8000`

## Frontend Setup

Requirements:

- Node.js
- npm

Commands:

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:4200`

## Database

MySQL database name: `classcatch`

Tables created through Step 2:

- users
- password_reset_tokens
- sessions
- classes
- class_memberships
- lessons
- lesson_files
- ai_summaries
- cache
- jobs
- personal_access_tokens

## Step 3 Status

Completed:

- Angular login page created.
- Angular registration page created.
- Authentication service created.
- Angular connected to Laravel API.
- Form validation and error messages implemented.
- Routes configured for `/login` and `/register`.
- Frontend build and development server verified.

## Step 4 Status

Completed:

- Teacher dashboard created.
- Student dashboard created.
- Protected Angular routes implemented.
- Role-based dashboard routing implemented.
- Dashboard access restricted by authenticated role.
- Frontend build verified.

## Step 5 Status

Completed:

- Teacher class creation endpoint implemented.
- Unique class code generation implemented.
- Teacher class listing endpoint implemented.
- Teacher dashboard updated with class creation form and class list.
- Student access to teacher class endpoints blocked.
- Frontend and backend tested successfully.

## API Endpoints Added

- `GET /api/classes` (teacher only)
- `POST /api/classes` (teacher only)

## Step 6 Status

Completed:

- Student class join endpoint implemented.
- Class code validation implemented.
- Duplicate class membership prevention implemented.
- Joined classes listing endpoint implemented.
- Student dashboard updated with join form and joined class list.
- Backend and frontend tested successfully.

## API Endpoints Added

- `POST /api/classes/join` (student only)
- `GET /api/classes/joined` (student only)

## Step 7 Status

Completed:

- Lesson model and relationships implemented.
- Teacher lesson creation endpoint implemented.
- Lesson listing endpoint implemented for class members.
- Teacher dashboard updated with lesson creation and lesson display.
- Student dashboard updated to display lessons for joined classes.
- Permissions tested for teachers, students, and non-members.

## API Endpoints Added

- `GET /api/classes/{class}/lessons`
- `POST /api/classes/{class}/lessons` (teacher only)

## Step 8 Status

Completed:

- Teacher material upload endpoint implemented.
- Assigned representative photo upload endpoint implemented.
- File type and size validation implemented.
- Files stored on the public disk with generated names.
- Storage link created.
- Teacher dashboard updated with material upload.
- Student dashboard updated with classroom photo upload.
- Permissions tested for teachers, representatives, and non-representatives.

## API Endpoints Added

- `GET /api/lessons/{lesson}/files`
- `POST /api/lessons/{lesson}/files` (teacher only)
- `POST /api/lessons/{lesson}/photos` (assigned representative only)

## Step 9 Status

Completed:

- Class member listing endpoint implemented.
- Student representative assignment endpoint implemented.
- Representative changes supported.
- Representative permission enforcement already used for photo uploads.
- Teacher dashboard updated with representative assignment UI.
- Permissions tested for teachers, members, and non-members.

## API Endpoints Added

- `GET /api/classes/{class}/students`
- `PUT /api/classes/{class}/representative`

## Step 10 Status

Completed:

- PDF and PPTX text extraction services implemented.
- Modular AI provider interface and OpenAI provider implemented.
- AI lesson summary generation endpoint implemented.
- Generated summaries saved in the database.
- Summary retrieval endpoint implemented.
- Teacher and student UI added for generating and viewing summaries.
- Missing AI credentials return a clear service-unavailable response instead of fake data.

## AI Environment Variables

```env
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
AI_TIMEOUT=60
```

## API Endpoints Added

- `POST /api/lessons/{lesson}/summary` (teacher only)
- `GET /api/lessons/{lesson}/summary`

## Step 11 Status

Completed:

- OCR abstraction and Tesseract extractor implemented.
- AI photo explanation service implemented.
- AI explanation generation endpoint implemented.
- Explanation retrieval endpoint implemented.
- Teacher and student UI added for photo explanations.
- Missing AI credentials return a clear service-unavailable response.

## API Endpoints Added

- `POST /api/lesson-files/{lessonFile}/explanation` (teacher or assigned representative)
- `GET /api/lesson-files/{lessonFile}/explanation`

## Step 12 Status

Completed final testing:

- Authentication tested.
- Teacher and student permissions tested.
- Class creation and joining tested.
- Lesson creation tested.
- File uploads tested.
- Student Representative assignment tested.
- AI summary and photo explanation endpoints tested.
- Frontend production build verified.
- Backend migrations and route list verified.

## Implemented Features

### Teacher workspace

- Create and manage classes with unique join codes.
- Switch between classes from the shared workspace header.
- Review student requests to join classes and approve or reject them.
- View class rosters and assign a Student Representative.
- Create, edit, and delete lessons and their uploaded materials.
- Upload PowerPoint files from a lesson page after reviewing a confirmation prompt showing the selected filename and size.
- Review classroom photos uploaded by the assigned Student Representative, then approve or reject them.
- Pending photos stay private during review; approved photos are published to the class.
- Browse lessons across classes with search, class/content filters, and date sorting.

### Student workspace

- Join a class using its code and view the request status while awaiting teacher approval.
- Browse approved classes, lessons, materials, and approved classroom photos.
- Search and filter lessons by class or content type, and sort them by date.
- Save lessons for later. Saved lesson IDs are stored in browser local storage per signed-in user and are not synced between devices.
- Open lesson materials and view available AI summaries and classroom photo explanations.

### Shared interface and notifications

- Separate teacher and student routes are protected by role-aware authentication guards.
- Class and lesson pages include responsive layouts for mobile screens, shared dashboard styling, and a custom class-switching menu.
- Lesson material names are constrained to their cards on narrow screens; material actions open the file in a new tab.
- Upload and logout flows use confirmation dialogs. Modal content can scroll independently while keeping its actions visible.
- Application errors appear as popup alerts; action results use dismissible toast notifications.

### AI and file processing

- PDF and PPTX text extraction supports AI-generated lesson summaries.
- Classroom photos can be processed for AI-generated explanations using the OCR abstraction and configured Tesseract extractor.
- AI generation requires a valid provider configuration. Missing credentials return a service-unavailable response rather than fabricated results.

## Additional API Endpoints

These authenticated routes are implemented in addition to the endpoints listed in the development steps above:

| Method | Endpoint | Purpose / access |
| --- | --- | --- |
| `GET` | `/api/classes/{schoolClass}` | View class details when authorized as the teacher or an eligible class member. |
| `GET` | `/api/classes/{schoolClass}/join-requests` | Teacher views requests for their class. |
| `POST` | `/api/classes/{schoolClass}/join-requests/{membership}/approve` | Teacher approves a student request. |
| `POST` | `/api/classes/{schoolClass}/join-requests/{membership}/reject` | Teacher rejects a student request. |
| `PUT` | `/api/lessons/{lesson}` | Teacher updates a lesson they own. |
| `DELETE` | `/api/lessons/{lesson}` | Teacher deletes a lesson they own. |
| `DELETE` | `/api/lesson-files/{lessonFile}` | Teacher deletes a lesson file in a class they own. |
| `PATCH` | `/api/lesson-files/{lessonFile}/moderation` | Teacher moderates a classroom photo. |

All routes in this table are under the `/api` prefix and require Sanctum authentication. The controllers enforce role, class membership, and ownership rules for each operation.

## Setup Notes

- Backend: `cd backend && php artisan serve`
- Frontend: `cd frontend && npm start`
- Database: MySQL database `classcatch`
- AI features require `AI_API_KEY` and optional `TESSERACT_BINARY` for OCR.
- Without AI credentials, AI endpoints return a service-unavailable response instead of fake data.
- Real-time websocket updates are currently disabled; pages refresh through their normal API loading actions.

## Project Status

All 12 development steps are complete.
