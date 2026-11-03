<?php

namespace App\Services\Ai;

use App\Services\Ai\Contracts\AiProvider;
use InvalidArgumentException;

class AiManager
{
    public function provider(): AiProvider
    {
        $provider = config('ai.provider', 'openai');

        return match ($provider) {
            'openai' => new OpenAiProvider,
            'gemini' => new GeminiProvider,
            default => throw new InvalidArgumentException("Unsupported AI provider [{$provider}]."),
        };
    }
}
