<?php

namespace App\Http\Controllers;

use App\Models\AiSummary;
use App\Models\ClassMembership;
use App\Models\Lesson;
use App\Services\Lesson\LessonSummaryService;
use App\Services\TextExtraction\TextExtractorManager;
use Illuminate\Http\Request;

class AiSummaryController extends Controller
{
    public function __construct(
        private readonly LessonSummaryService $summaryService,
        private readonly TextExtractorManager $extractor,
    ) {}

    public function generate(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can generate a lesson summary.');
        }

        try {
            $summary = $this->summaryService->generate($lesson);
        } catch (\RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

        return response()->json($summary, 201);
    }

    public function index(Request $request, Lesson $lesson)
    {
        $user = $request->user();
        $schoolClass = $lesson->schoolClass;

        if (! $this->canView($user, $schoolClass)) {
            abort(403, 'You cannot view this lesson summary.');
        }

        $summary = AiSummary::where('lesson_id', $lesson->id)
            ->where('type', 'summary')
            ->latest()
            ->first();

        if (! $summary) {
            return response()->json([
                'message' => 'No lesson summary is available yet.',
            ], 404);
        }

        return response()->json($summary);
    }

    private function canView($user, $schoolClass): bool
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
