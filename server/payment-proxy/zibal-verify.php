<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';

proxy_require_post();
proxy_require_secret();

$config = proxy_config();
$body = proxy_read_json_body();

$trackId = isset($body['trackId']) ? trim((string) $body['trackId']) : '';

if ($trackId === '') {
    proxy_json_response([
        'ok' => false,
        'message' => 'trackId is required.',
    ], 400);
}

$payload = [
    'merchant' => $config['merchant'],
    'trackId' => $trackId,
];

$zibal = proxy_call_zibal((string) $config['zibal_verify_url'], $payload);
$data = $zibal['decoded_response'];

proxy_json_response([
    'ok' => $zibal['curl_error'] === null && $zibal['http_code'] === 200 && is_array($data),
    'result' => is_array($data) ? ($data['result'] ?? null) : null,
    'message' => is_array($data) ? ($data['message'] ?? null) : null,
    'zibal' => $data,
], $zibal['http_code'] >= 400 ? $zibal['http_code'] : 200);
