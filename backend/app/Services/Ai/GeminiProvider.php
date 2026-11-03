<?php

namespace App\Services\Ai;

use App\Services\Ai\Contracts\AiProvider;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class GeminiProvider implements AiProvider
{
    public function summarize(string $text, array $imagePaths = []): string
    {
        $parts = [['text' => $text]];
        foreach ($imagePaths as $imagePath) {
            if (! is_file($imagePath)) {
                continue;
            }

            $parts[] = [
                'inlineData' => [
                    'mimeType' => $this->imageMimeType($imagePath),
                    'data' => $this->imageBase64($imagePath),
                ],
            ];
        }

        return $this->generate([
            'systemInstruction' => [
                'parts' => [
                    ['text' => 'You are an educational assistant. Write a concise but complete study guide based only on the supplied lesson text and classroom photos. Include legible board notes, diagrams, and equations when relevant; do not guess at unclear image content. Preserve important facts, definitions, and relationships; avoid repetition and filler. Use Markdown with a brief overview, clear section headings, and focused bullet points for key ideas and takeaways. Be precise, and do not omit essential details just to make the answer shorter.'],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => $parts,
                ],
            ],
        ]);
    }

    public function explainImage(string $imagePath, ?string $ocrText = null): string
    {
        return $this->generate([
            'systemInstruction' => [
                'parts' => [
                    ['text' => 'You are an educational assistant. Explain what is visible in a classroom or lesson image and how it relates to the lesson.'],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $ocrText ?? 'Extract readable text from this classroom or lesson image.'],
                        [
                            'inlineData' => [
                                'mimeType' => $this->imageMimeType($imagePath),
                                'data' => $this->imageBase64($imagePath),
                            ],
                        ],
                    ],
                ],
            ],
        ]);
    }

    private function generate(array $payload): string
    {
        $apiKey = Config::get('ai.api_key');

        if (! $apiKey) {
            throw new \RuntimeException('The AI API key is not configured.');
        }

        $baseUrl = rtrim((string) Config::get('ai.base_url'), '/');
        $model = (string) Config::get('ai.model');
        $url = "{$baseUrl}/models/{$model}:generateContent";

        $requestPayload = array_merge($payload, [
            'generationConfig' => [
                'temperature' => 0.2,
            ],
        ]);

        $response = Http::timeout((int) Config::get('ai.timeout', 60))
            ->withOptions(['verify' => (bool) Config::get('ai.verify_ssl', true)])
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post($url, $requestPayload);

        if ($response->failed()) {
            throw new \RuntimeException('The AI service request failed: '.$response->body());
        }

        $content = $this->extractText($response->json());

        if (trim($content) === '') {
            throw new \RuntimeException('The AI service returned an empty response.');
        }

        return trim($content);
    }

    private function extractText(mixed $json): string
    {
        $parts = data_get($json, 'candidates.0.content.parts', []);

        if (! is_array($parts)) {
            return '';
        }

        $text = '';

        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $text .= $part['text'];
            }
        }

        return $text;
    }

    private function imageBase64(string $imagePath): string
    {
        return base64_encode(file_get_contents($imagePath));
    }

    private function imageMimeType(string $imagePath): string
    {
        $mimeType = mime_content_type($imagePath);

        if (is_string($mimeType) && $mimeType !== '') {
            return $mimeType;
        }

        return 'image/png';
    }
}
