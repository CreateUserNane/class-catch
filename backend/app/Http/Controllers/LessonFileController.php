<?php

namespace App\Http\Controllers;

use App\Models\ClassMembership;
use App\Models\Lesson;
use App\Models\LessonFile;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonFileController extends Controller
{
    public function index(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if (! $this->canView($user, $schoolClass)) {
            abort(403, 'You cannot view files for this lesson.');
        }

        return response()->json($lesson->files()->latest()->get());
    }

    public function uploadMaterial(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can upload materials.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,ppt,pptx,doc,docx', 'max:10240'],
        ]);

        $file = $validated['file'];
        $path = $file->store('lesson-materials', 'public');

        $lessonFile = LessonFile::create([
            'lesson_id' => $lesson->id,
            'uploaded_by' => $user->id,
            'type' => 'material',
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json($lessonFile, 201);
    }

    public function uploadPhoto(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if ($user->role !== 'student' || $schoolClass->representative_id !== $user->id) {
            abort(403, 'Only the assigned student representative can upload photos.');
        }

        $isMember = ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $user->id)
            ->exists();

        if (! $isMember) {
            abort(403, 'You must be a member of this class.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);

        $file = $validated['file'];
        $path = $file->store('classroom-photos', 'public');

        $lessonFile = LessonFile::create([
            'lesson_id' => $lesson->id,
            'uploaded_by' => $user->id,
            'type' => 'photo',
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json($lessonFile, 201);
    }

    public function destroy(Request $request, LessonFile $lessonFile)
    {
        $user = $request->user();
        $schoolClass = $lessonFile->lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can delete lesson files.');
        }

        Storage::disk('public')->delete($lessonFile->path);
        $lessonFile->delete();

        return response()->json([
            'message' => 'File deleted successfully.',
        ]);
    }

    private function canView(User $user, SchoolClass $schoolClass): bool
    {
        if ($user->role === 'teacher' && $schoolClass->teacher_id === $user->id) {
            return true;
        }

        if ($user->role === 'student') {
            return ClassMembership::where('class_id', $schoolClass->id)
                ->where('student_id', $user->id)
                ->exists();
        }

        return false;
    }
}
