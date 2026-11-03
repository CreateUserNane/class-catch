<?php

namespace App\Services\Ai\Contracts;

interface AiProvider
{
    public function summarize(string $text, array $imagePaths = []): string;

    public function explainImage(string $imagePath, ?string $ocrText = null): string;
}
