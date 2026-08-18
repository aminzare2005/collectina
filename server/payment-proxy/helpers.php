<?php

declare(strict_types=1);

function proxy_config(): array
{
    static $config = null;

    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }

    return $config;
}

function proxy_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function proxy_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        proxy_json_response([
            'ok' => false,
            'message' => 'Method not allowed. Use POST.',
        ], 405);
    }
}

function proxy_require_secret(): void
{
    $config = proxy_config();
    $providedSecret = $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';

    if (
        ($config['proxy_secret'] ?? '') === 'PASTE_A_LONG_RANDOM_SECRET'
        || ($config['merchant'] ?? '') === 'PASTE_YOUR_ZIBAL_MERCHANT_ID'
    ) {
        proxy_json_response([
            'ok' => false,
            'message' => 'Proxy config is not configured on the server.',
        ], 500);
    }

    if ($providedSecret === '' || !hash_equals((string) $config['proxy_secret'], $providedSecret)) {
        proxy_json_response([
            'ok' => false,
            'message' => 'Unauthorized proxy request.',
        ], 401);
    }
}

function proxy_read_json_body(): array
{
    $rawBody = file_get_contents('php://input');
    $decoded = json_decode($rawBody ?: '', true);

    if (!is_array($decoded)) {
        proxy_json_response([
            'ok' => false,
            'message' => 'Invalid JSON body.',
        ], 400);
    }

    return $decoded;
}

function proxy_validate_callback_url(string $callbackUrl, string $allowedHost): bool
{
    $parts = parse_url($callbackUrl);

    if (!is_array($parts) || empty($parts['host'])) {
        return false;
    }

    $host = strtolower($parts['host']);

    return $host === strtolower($allowedHost) || str_ends_with($host, '.' . strtolower($allowedHost));
}

function proxy_call_zibal(string $url, array $payload): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    $rawResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decodedResponse = null;
    if (is_string($rawResponse) && $rawResponse !== '') {
        $decodedResponse = json_decode($rawResponse, true);
    }

    return [
        'http_code' => $httpCode,
        'curl_error' => $curlError !== '' ? $curlError : null,
        'raw_response' => $rawResponse,
        'decoded_response' => is_array($decodedResponse) ? $decodedResponse : null,
    ];
}
