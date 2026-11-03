<?php

namespace App\Services\TextExtraction;

use App\Models\LessonFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class TextExtractorManager
{
    public function for(LessonFile $file): TextExtractor
    {
        $mimeType = strtolower($file->mime_type);
        $extension = strtolower(pathinfo($file->original_name, PATHINFO_EXTENSION));

        if ($mimeType === 'application/pdf' || $extension === 'pdf') {
            return new PdfTextExtractor;
        }

        if (
            in_array($mimeType, [
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-powerpoint',
            ], true)
            || in_array($extension, ['pptx', 'ppt'], true)
        ) {
            return new PptxTextExtractor;
        }

        throw new InvalidArgumentException("Unsupported file type for text extraction: {$file->mime_type}");
    }

    public function extract(LessonFile $file): string
    {
        $path = Storage::disk('public')->path($file->path);

        return $this->for($file)->extract($path, $file->mime_type);
    }
}
