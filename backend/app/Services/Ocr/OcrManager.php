<?php

namespace App\Services\Ocr;

use App\Services\Ocr\Contracts\OcrExtractor;

class OcrManager
{
    public function extractor(): OcrExtractor
    {
        return new TesseractOcrExtractor;
    }
}
