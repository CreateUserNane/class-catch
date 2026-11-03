<?php

namespace App\Services\TextExtraction;

use Smalot\PdfParser\Parser;

class PdfTextExtractor implements TextExtractor
{
    public function extract(string $path, string $mimeType): string
    {
        $parser = new Parser;
        $pdf = $parser->parseFile($path);

        return trim($pdf->getText());
    }
}
