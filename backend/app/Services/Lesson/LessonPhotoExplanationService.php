<?php

namespace App\Services\Lesson;

use App\Models\AiSummary;
use App\Models\LessonFile;
use App\Services\Ai\AiManager;
use App\Services\Ocr\OcrManager;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LessonPhotoExplanationService
{
    public function __construct(
        private readonly OcrManager $ocr,
        private readonly AiManager $ai,
    ) {}

    public function generate(LessonFile $file): AiSummary
    {
        if ($file->type !== 'photo' && ! str_starts_with((string) $file->mime_type, 'image/')) {
            throw new RuntimeException('The selected file is not an image.');
        }

        $path = Storage::disk('public')->path($file->path);

        $ocrText = $this->ocr->extractor()->extract($path);

        $explanation = $this->ai->provider()->explainImage($path, $ocrText !== '' ? $ocrText : null);

        return AiSummary::create([
            'lesson_id' => $file->lesson_id,
            'lesson_file_id' => $file->id,
            'type' => 'explanation',
            'content' => $explanation,
        ]);
    }
}
