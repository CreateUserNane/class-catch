<?php

namespace App\Services\Lesson;

use App\Models\AiSummary;
use App\Models\Lesson;
use App\Services\Ai\AiManager;
use App\Services\TextExtraction\TextExtractorManager;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LessonSummaryService
{
    public function __construct(
        private readonly TextExtractorManager $extractor,
        private readonly AiManager $ai,
    ) {}

    public function generate(Lesson $lesson): AiSummary
    {
        $files = $lesson->files()->where('type', 'material')->get();
        $photos = $lesson->files()->where('type', 'photo')->where('status', 'approved')->get();

        if ($files->isEmpty() && $photos->isEmpty()) {
            throw new RuntimeException('No learning materials or classroom photos are available for this lesson.');
        }

        $materialText = '';
        if (trim((string) $lesson->description) !== '') {
            $materialText .= "Description: {$lesson->description}\n";
        }

        foreach ($files as $file) {
            try {
                $extracted = $this->extractor->extract($file);
            } catch (\Throwable $exception) {
                throw new RuntimeException('Text could not be extracted from '.$file->original_name.'.');
            }

            if (trim($extracted) !== '') {
                $materialText .= $extracted."\n\n";
            }
        }

        $imagePaths = $photos
            ->map(fn ($photo) => Storage::disk('public')->path($photo->path))
            ->filter(fn ($path) => is_file($path))
            ->values()
            ->all();

        if (trim($materialText) === '' && $imagePaths === []) {
            throw new RuntimeException('No readable text or classroom photos are available for this lesson.');
        }

        $text = "Lesson: {$lesson->title}\n".$materialText;
        $summary = $this->ai->provider()->summarize(trim($text), $imagePaths);

        return AiSummary::create([
            'lesson_id' => $lesson->id,
            'lesson_file_id' => null,
            'type' => 'summary',
            'content' => $summary,
        ]);
    }
}
