<?php

namespace App\Services\TextExtraction;

interface TextExtractor
{
    public function extract(string $path, string $mimeType): string;
}
