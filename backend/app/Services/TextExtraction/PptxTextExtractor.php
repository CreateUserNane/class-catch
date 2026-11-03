<?php

namespace App\Services\TextExtraction;

use PhpOffice\PhpPresentation\IOFactory;
use PhpOffice\PhpPresentation\Shape\RichText;
use PhpOffice\PhpPresentation\Shape\Table;

class PptxTextExtractor implements TextExtractor
{
    public function extract(string $path, string $mimeType): string
    {
        $presentation = IOFactory::load($path, 'PowerPoint2007');

        $text = '';

        foreach ($presentation->getAllSlides() as $slide) {
            foreach ($slide->getShapeCollection() as $shape) {
                if ($shape instanceof RichText) {
                    $text .= $shape->getPlainText()."\n";
                } elseif ($shape instanceof Table) {
                    foreach ($shape->getRows() as $row) {
                        foreach ($row->getCells() as $cell) {
                            $text .= $cell->getPlainText().' ';
                        }
                        $text .= "\n";
                    }
                }
            }
            $text .= "\n";
        }

        return trim($text);
    }
}
