<?php

namespace App\Services\Ai;

use App\Services\Ai\Contracts\AiProvider;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class OpenAiProvider implements AiProvider
{
    public function summarize(string $text, array $imagePaths = []): string
    {
        $imageContent = [];
        foreach ($imagePaths as $imagePath) {
            if (! is_file($imagePath)) {
                continue;
            }

            $mimeType = mime_content_type($imagePath) ?: 'image/jpeg';
            $imageContent[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => 'data:'.$mimeType.';base64,'.$this->imageBase64($imagePath),
                ],
            ];
        }

        $userContent = $imageContent === []
            ? $text
            : array_merge([['type' => 'text', 'text' => $text]], $imageContent);

        return $this->complete([
            'model' => Config::get('ai.model'),
            'temperature' => 0.2,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an educational assistant. Write a concise but complete study guide based only on the supplied lesson text and classroom photos. Include legible board notes, diagrams, and equations when relevant; do not guess at unclear image content. Preserve important facts, definitions, and relationships; avoid repetition and filler. Use Markdown with a brief overview, clear section headings, and focused bullet points for key ideas and takeaways. Be precise, and do not omit essential details just to make the answer shorter.',
                ],
                [
                    'role' => 'user',
                    'content' => $userContent,
                ],
            ],
        ]);
    }

    public function explainImage(string $imagePath, ?string $ocrText = null): string
    {
        return $this->complete([
            'model' => Config::get('ai.model'),
            'temperature' => 0.2,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an educational assistant. Explain what is visible in a classroom or lesson image and how it relates to the lesson.',
                ],
                [
                    'role' => 'user',
                    'content' => [
                        ['type' => 'text', 'text' => $ocrText ?? 'Extract readable text from this classroom or lesson image.'],
                        ['type' => 'image_url', 'image_url' => ['url' => 'data:image/png;base64,'.$this->imageBase64($imagePath)]],
                    ],
                ],
            ],
        ]);
    }

    private function complete(array $payload): string
    {
        $apiKey = Config::get('ai.api_key');

        if (! $apiKey) {
            throw new \RuntimeException('The AI API key is not configured.');
        }

        $baseUrl = rtrim((string) Config::get('ai.base_url'), '/');
        $response = Http::timeout((int) Config::get('ai.timeout', 60))
            ->withOptions(['verify' => (bool) Config::get('ai.verify_ssl', true)])
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $payload['model'],
                'temperature' => $payload['temperature'],
                'messages' => $payload['messages'],
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('The AI service request failed: '.$response->body());
        }

        $content = $response->json('data.choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new \RuntimeException('The AI service returned an empty response.');
        }

        return trim($content);
    }

    private function imageBase64(string $imagePath): string
    {
        return base64_encode(file_get_contents($imagePath));
    }
}
