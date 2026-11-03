# Features Added

This document summarizes the ClassCatch features and fixes added during our work together.

## Accounts and sign-in

- Login sessions are restored after a page refresh, and account access is routed according to the user's teacher or student role.
- Registration checks email formatting and common provider typos, and the server checks that the email domain exists.
- After successful registration, a confirmation notification appears and the user is sent to the login page.
- Logging out from desktop or mobile asks for confirmation first.
- Login and registration pages have matching animated icon backgrounds, field icons, and a more polished chalk-inspired card design.
- Login and registration cards use a layered, hand-torn paper edge treatment while retaining the existing color palette.

## Classes and membership

- Students request to join a class; requests remain **Pending** until the teacher approves or rejects them.
- Students can see pending or declined status on My Classes, and can send a new request after a decline.
- Teachers can approve or reject join requests from the class page or Review Queue.
- Teachers can assign a student representative to each class.
- Teacher and student **Dashboards** are separate overview pages with role-specific counts and recent lessons.
- **My Classes** is a separate page for the full class list and class actions.
- Class detail pages link back to My Classes.
- Teacher navigation includes a cross-class **Lessons** library and a **Review Queue** for approving student class join requests and approving or rejecting pending classroom photos.
- Student navigation includes **Lessons** and **Saved Lessons**. The lessons library lists lessons across approved classes; saved lessons can be bookmarked and are stored per student in that browser. Pending class joins remain visible on My Classes.

## Classroom photos and AI

- Teachers can upload PowerPoint (.ppt/.pptx) files directly from a lesson page; the file appears in that lesson's materials.
- Only the teacher or the assigned student representative can upload photos for that class. Representatives start uploads from a lesson so each photo is associated with that lesson.
- Photo selection supports browsing and drag and drop, with file checks and a preview before upload.
- Representative uploads wait for teacher review. Students see the pending status; approved photos appear to the class.
- Teachers can approve or reject uploads and delete photos if they were approved by mistake.
- AI lesson summaries can include approved classroom photos. Only teachers can generate or regenerate summaries; students can read the summaries.
- The lesson summary was moved below the lesson materials and redesigned with clearer hierarchy, spacing, and icons.
- Classroom photo files are stored in Laravel's public storage under `classroom-photos`; lesson records store the file metadata and path.

## Navigation and layout

- Desktop uses a sidebar; mobile uses a floating, fully rounded bottom navigation bar.
- Dashboard and My Classes highlights follow the current page, including class detail and lesson pages.
- Breadcrumbs and top bar styling are shared across pages, with matching navigation colors and icon sizing.
- A custom layered ClassCatch book mark is used in the app sidebar, authentication pages, and browser tab icon.
