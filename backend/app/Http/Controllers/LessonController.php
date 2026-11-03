<?php

namespace App\Http\Controllers;

use App\Models\ClassMembership;
use App\Models\Lesson;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonController extends Controller
{
    public function index(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        if (! $this->canView($user, $schoolClass)) {
            abort(403, 'You cannot view lessons for this class.');
        }

        return response()->json($schoolClass->lessons()->latest()->get());
    }

    public function store(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can create lessons.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $lesson = Lesson::create([
            'class_id' => $schoolClass->id,
            'teacher_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json($lesson, 201);
    }

    public function show(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if (! $this->canView($user, $schoolClass)) {
            abort(403, 'You cannot view this lesson.');
        }

        return response()->json($lesson->load([
            'teacher',
            'schoolClass.teacher',
            'files',
            'files.uploader',
            'summary',
            'summary.lessonFile.uploader',
        ]));
    }

    public function update(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can update this lesson.');
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $lesson->update($validated);

        return response()->json($lesson->load([
            'teacher',
            'schoolClass.teacher',
        ]));
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can delete this lesson.');
        }

        foreach ($lesson->files as $file) {
            Storage::disk('public')->delete($file->path);
            $file->delete();
        }

        $lesson->delete();

        return response()->json([
            'message' => 'Lesson deleted successfully.',
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
