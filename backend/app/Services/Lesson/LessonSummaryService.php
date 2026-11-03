<?php

namespace App\Services\Lesson;

use App\Models\AiSummary;
use App\Models\Lesson;
use App\Services\Ai\AiManager;
use App\Services\TextExtraction\TextExtractorManager;
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

        if ($files->isEmpty()) {
            throw new RuntimeException('No learning materials are available for this lesson.');
        }

        $text = '';

        foreach ($files as $file) {
            try {
                $extracted = $this->extractor->extract($file);
            } catch (\Throwable $exception) {
                throw new RuntimeException('Text could not be extracted from '.$file->original_name.'.');
            }

            if (trim($extracted) !== '') {
                $text .= $extracted."\n\n";
            }
        }

        if (trim($text) === '') {
            throw new RuntimeException('No readable text could be extracted from the uploaded materials.');
        }

        $summary = $this->ai->provider()->summarize($text);

        return AiSummary::create([
            'lesson_id' => $lesson->id,
            'lesson_file_id' => null,
            'type' => 'summary',
            'content' => $summary,
        ]);
    }
}
