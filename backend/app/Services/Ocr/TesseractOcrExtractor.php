<?php

namespace App\Services\Ocr;

use App\Services\Ocr\Contracts\OcrExtractor;

class TesseractOcrExtractor implements OcrExtractor
{
    private ?string $binary;

    public function __construct()
    {
        $this->binary = $this->resolveBinary();
    }

    public function extract(string $path): string
    {
        if (! $this->binary) {
            return '';
        }

        $outputBase = sys_get_temp_dir().DIRECTORY_SEPARATOR.'classcatch_ocr_'.uniqid();
        $command = escapeshellarg($this->binary)
            .' '.escapeshellarg($path)
            .' '.escapeshellarg($outputBase)
            .' 2>&1';

        shell_exec($command);

        $text = '';

        if (file_exists($outputBase.'.txt')) {
            $text = file_get_contents($outputBase.'.txt');
            @unlink($outputBase.'.txt');
        }

        return trim((string) $text);
    }

    public function isAvailable(): bool
    {
        return $this->binary !== null;
    }

    private function resolveBinary(): ?string
    {
        $configured = config('ocr.binary');

        if (is_string($configured) && $configured !== '' && file_exists($configured)) {
            return $configured;
        }

        $result = shell_exec('where tesseract 2>nul');

        if (is_string($result) && trim($result) !== '') {
            return trim(explode("\n", $result)[0]);
        }

        return null;
    }
}
