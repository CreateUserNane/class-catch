


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

- PHP 8.2+
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

Create the database, then run:

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

## Setup Notes

- Backend: `cd backend && php artisan serve`
- Frontend: `cd frontend && npm start`
- Database: MySQL database `classcatch`
- AI features require `AI_API_KEY` and optional `TESSERACT_BINARY` for OCR.
- Without AI credentials, AI endpoints return a service-unavailable response instead of fake data.

## Project Status

All 12 development steps are complete.
