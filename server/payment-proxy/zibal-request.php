<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';

proxy_require_post();
proxy_require_secret();

$config = proxy_config();
$body = proxy_read_json_body();

$amount = isset($body['amount']) ? (int) $body['amount'] : 0;
$orderId = isset($body['orderId']) ? trim((string) $body['orderId']) : '';
$callbackUrl = isset($body['callbackUrl']) ? trim((string) $body['callbackUrl']) : '';
$description = isset($body['description']) ? trim((string) $body['description']) : '';

if ($amount < 1000 || $orderId === '' || $callbackUrl === '') {
    proxy_json_response([
        'ok' => false,
        'message' => 'amount, orderId and callbackUrl are required.',
    ], 400);
}

if (!proxy_validate_callback_url($callbackUrl, (string) $config['allowed_callback_host'])) {
    proxy_json_response([
        'ok' => false,
        'message' => 'callbackUrl must belong to ' . $config['allowed_callback_host'],
    ], 400);
}

$payload = [
    'merchant' => $config['merchant'],
    'amount' => $amount,
    'callbackUrl' => $callbackUrl,
    'description' => $description !== '' ? $description : ('Payment for order ' . $orderId),
    'orderId' => $orderId,
];

$zibal = proxy_call_zibal((string) $config['zibal_request_url'], $payload);
$data = $zibal['decoded_response'];

proxy_json_response([
    'ok' => $zibal['curl_error'] === null && $zibal['http_code'] === 200 && is_array($data),
    'result' => is_array($data) ? ($data['result'] ?? null) : null,
    'trackId' => is_array($data) ? ($data['trackId'] ?? null) : null,
    'message' => is_array($data) ? ($data['message'] ?? null) : null,
    'zibal' => $data,
], $zibal['http_code'] >= 400 ? $zibal['http_code'] : 200);
