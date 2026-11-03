<?php

return [
    'provider' => env('AI_PROVIDER', 'gemini'),

    'api_key' => env('AI_API_KEY'),

    'model' => env('AI_MODEL', 'gemini-3.5-flash'),

    'base_url' => env('AI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),

    'timeout' => env('AI_TIMEOUT', 60),

    'verify_ssl' => env('AI_VERIFY_SSL', true),
];
