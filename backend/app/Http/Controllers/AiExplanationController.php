<?php

namespace App\Http\Controllers;

use App\Models\AiSummary;
use App\Models\ClassMembership;
use App\Models\LessonFile;
use App\Services\Lesson\LessonPhotoExplanationService;
use Illuminate\Http\Request;

class AiExplanationController extends Controller
{
    public function __construct(
        private readonly LessonPhotoExplanationService $explanationService,
    ) {}

    public function generate(Request $request, LessonFile $lessonFile)
    {
        $user = $request->user();
        $schoolClass = $lessonFile->lesson->schoolClass;

        if ($lessonFile->type !== 'photo' || $lessonFile->status !== 'approved') {
            abort(403, 'This photo must be approved before an AI explanation can be generated.');
        }

        if (! $this->canGenerate($user, $schoolClass)) {
            abort(403, 'You cannot generate an explanation for this photo.');
        }

        try {
            $explanation = $this->explanationService->generate($lessonFile);
        } catch (\RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

        return response()->json($explanation, 201);
    }

    public function index(Request $request, LessonFile $lessonFile)
    {
        $user = $request->user();
        $schoolClass = $lessonFile->lesson->schoolClass;

        if ($lessonFile->type !== 'photo' || $lessonFile->status !== 'approved') {
            abort(403, 'This photo is not available for viewing yet.');
        }

        if (! $this->canView($user, $schoolClass)) {
            abort(403, 'You cannot view this photo explanation.');
        }

        $explanation = AiSummary::where('lesson_file_id', $lessonFile->id)
            ->where('type', 'explanation')
            ->latest()
            ->first();

        if (! $explanation) {
            return response()->json([
                'message' => 'No photo explanation is available yet.',
            ], 404);
        }

        return response()->json($explanation);
    }

    private function canGenerate($user, $schoolClass): bool
    {
        if ($user->role === 'teacher' && $schoolClass->teacher_id === $user->id) {
            return true;
        }

        if ($user->role === 'student' && $schoolClass->representative_id === $user->id) {
            return ClassMembership::where('class_id', $schoolClass->id)
                ->where('student_id', $user->id)
                ->where('status', 'approved')
                ->exists();
        }

        return false;
    }

    private function canView($user, $schoolClass): bool
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
}
