<?php

namespace App\Services\Ocr\Contracts;

interface OcrExtractor
{
    public function extract(string $path): string;
}
