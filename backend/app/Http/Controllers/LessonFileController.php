<?php

namespace App\Http\Controllers;

use App\Events\ClassUpdated;
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

        return response()->json($this->visibleFiles($lesson, $user));
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
            'status' => 'approved',
        ]);

        ClassUpdated::dispatchSafely($schoolClass->id, 'file.uploaded');

        return response()->json($lessonFile, 201);
    }

    public function uploadPhoto(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        $isTeacher = $user->role === 'teacher' && $schoolClass->teacher_id === $user->id;
        $isRepresentative = $user->role === 'student' && $schoolClass->representative_id === $user->id;

        if (! $isTeacher && ! $isRepresentative) {
            abort(403, 'Only the class teacher or assigned student representative can upload photos.');
        }

        if ($isRepresentative) {
            $isMember = ClassMembership::where('class_id', $schoolClass->id)
                ->where('student_id', $user->id)
                ->where('status', 'approved')
                ->exists();

            if (! $isMember) {
                abort(403, 'You must be an approved class member to upload photos.');
            }
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
            'status' => $isTeacher ? 'approved' : 'pending',
        ]);

        ClassUpdated::dispatchSafely($schoolClass->id, 'photo.uploaded');

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

        ClassUpdated::dispatchSafely($schoolClass->id, 'file.deleted');

        return response()->json([
            'message' => 'File deleted successfully.',
        ]);
    }

    public function moderatePhoto(Request $request, LessonFile $lessonFile)
    {
        $user = $request->user();
        $schoolClass = $lessonFile->lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can review classroom photos.');
        }

        if ($lessonFile->type !== 'photo') {
            abort(422, 'Only classroom photos can be reviewed.');
        }

        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $lessonFile->update(['status' => $validated['status']]);

        ClassUpdated::dispatchSafely($schoolClass->id, 'photo.moderated');

        return response()->json($lessonFile->load('uploader'));
    }

    private function canView(User $user, SchoolClass $schoolClass): bool
    {
        if ($user->role === 'teacher' && $schoolClass->teacher_id === $user->id) {
            return true;
        }

        if ($user->role === 'student') {
            return ClassMembership::where('class_id', $schoolClass->id)
                ->where('student_id', $user->id)
                ->where('status', 'approved')
                ->exists();
        }

        return false;
    }

    private function visibleFiles(Lesson $lesson, User $user)
    {
        $schoolClass = $lesson->schoolClass;
        $isTeacher = $user->role === 'teacher' && $schoolClass->teacher_id === $user->id;

        return $lesson->files()
            ->with('uploader')
            ->when(! $isTeacher, function ($query) use ($user) {
                $query->where(function ($visible) use ($user) {
                    $visible->where('type', 'material')
                        ->orWhere(function ($photo) use ($user) {
                            $photo->where('type', 'photo')
                                ->where(function ($status) use ($user) {
                                    $status->where('status', 'approved')
                                        ->orWhere('uploaded_by', $user->id);
                                });
                        });
                });
            })
            ->latest()
            ->get();
    }
}
